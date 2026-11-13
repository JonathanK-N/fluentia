/**
 * Conversation vocale avec l’examinateur IA.
 *
 * Le navigateur parle directement au fournisseur en WebRTC avec la clé éphémère créée par le serveur :
 * la clé d’API de Fluentia ne quitte jamais le serveur. Le fournisseur « demo » ne contacte rien :
 * un examinateur scripté lit ses questions avec la synthèse vocale du navigateur.
 */

export type Speaker = "examiner" | "candidate";
export type Turn = { id: string; role: Speaker; text: string; final: boolean };
export type Usage = { audio_in: number; cached_audio_in: number; text_in: number; cached_text_in: number; audio_out: number; text_out: number; transcription_seconds: number; transcription_in: number; transcription_out: number };
export type Activity = "connecting" | "examiner" | "candidate" | "waiting";

export type SpeakingSession = {
  id: number; demo: boolean; client_secret: string; expires_at: string;
  model: string; voice: string; seconds: number; prep_seconds: number;
};

export type ExaminerHandlers = {
  onActivity: (activity: Activity) => void;
  onTurn: (turn: Turn) => void;
  onUsage: (usage: Partial<Usage>) => void;
  onError: (message: string) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  /** La connexion avec l’examinateur est coupée pour de bon (réseau, fournisseur). */
  onLost?: () => void;
};

const FOREIGN_SCRIPT = /[Ͱ-ϿЀ-ԯ֐-ۿऀ-෿฀-໿ᄀ-ᇿ぀-ヿ㐀-鿿가-힯＀-￯]/;
// Petits mots très fréquents : une phrase française en contient presque toujours au moins un.
const FRENCH_WORDS = new Set((
  "a à je j tu il elle on nous vous ils elles le la les l un une des du de d et ou mais donc car que qu qui quoi est c ce cet cette ces ça ca " +
  "pas ne n oui non merci bonjour au aux en dans pour par avec sur sous chez mon ma mes ton ta tes son sa ses notre votre nos vos leur leurs " +
  "suis es sommes êtes sont ai avons avez ont était été fait faire fais va vais vas allez peux peut pouvez veux veut voudrais aimerais " +
  "bien très plus moins aussi alors parce comme tout tous toute toutes quand où comment combien pourquoi quel quelle quels quelles y là ici " +
  "accord exactement voilà euh ben bah ok aussi déjà encore même autre autres beaucoup peu trop rien personne quelque chose"
).split(" "));
// Mots anglais courants qui n’existent pas en français.
const ENGLISH_WORDS = new Set((
  "the is are was were this that these those our my your you he she they we what which who whose with have has had do does did " +
  "don not and of to it its for from will would can could should be been there their them here time last yes thank thanks please " +
  "hello hi i im it's okay just about because very really want know think going get got like"
).split(" "));

/**
 * L’épreuve est en français : la transcription ne garde que le français. Un passage dans une autre écriture
 * (chinois, arabe, cyrillique…) ou dans une autre langue (anglais, espagnol, portugais…) est une transcription
 * inventée sur un bruit ou un silence, ou une phrase hors épreuve : il n’est ni affiché, ni enregistré, ni corrigé.
 */
export function notFrench(text: string) {
  if (FOREIGN_SCRIPT.test(text)) return true;
  const words = text.toLowerCase().match(/[a-zà-ÿœæ]+/g) ?? [];
  const french = words.filter(word => FRENCH_WORDS.has(word)).length;
  const english = words.filter(word => ENGLISH_WORDS.has(word)).length;
  return (english >= 2 && english > french) || (words.length >= 3 && french === 0);
}

export type ExaminerConnection = {
  microphone: MediaStream;
  setMuted: (muted: boolean) => void;
  /** Tâche 2 : fin de la préparation. L’examinateur annonce le début des questions, puis écoute le candidat. */
  startQuestions: () => void;
  /** Demande à l’examinateur de conclure poliment ; se résout quand il a fini de parler (ou après le délai). */
  conclude: (sentence?: string) => Promise<void>;
  close: () => void;
};

export const emptyUsage = (): Usage => ({ audio_in: 0, cached_audio_in: 0, text_in: 0, cached_text_in: 0, audio_out: 0, text_out: 0, transcription_seconds: 0, transcription_in: 0, transcription_out: 0 });

export function addUsage(total: Usage, part: Partial<Usage>): Usage {
  const next = { ...total };
  for (const key of Object.keys(next) as (keyof Usage)[]) next[key] += part[key] ?? 0;
  return next;
}

/** Les tours sont rangés dans l’ordre de leur première apparition ; une transcription tardive complète sa place. */
export function upsertTurn(turns: Turn[], turn: Turn): Turn[] {
  const index = turns.findIndex(t => t.id === turn.id);
  if (index < 0) return [...turns, turn];
  const next = turns.slice();
  next[index] = { ...next[index]!, text: turn.text || next[index]!.text, final: turn.final || next[index]!.final };
  return next;
}

/** Phrase de fin, dite telle quelle quand le temps est écoulé. */
export const CLOSING_SENTENCE = "Merci beaucoup pour vos réponses. Le temps est écoulé, nous allons nous arrêter ici. Au revoir.";
/** Tâche 2 : l’examinateur prend congé dans son rôle, quelle que soit la situation (appel, visite, courriel…). */
export const ROLEPLAY_CLOSING_SENTENCE = "Merci pour vos questions. Si vous avez besoin d’autres informations, n’hésitez pas à nous recontacter. Au revoir.";
/** Tâche 2 : fin des deux minutes de préparation ; c’est ensuite le candidat qui mène. */
export const QUESTIONS_SENTENCE = "Les deux minutes de préparation sont terminées. Nous pouvons commencer : je vous écoute.";
// Ces consignes remplacent celles de la session pour cette seule réponse : la langue doit donc y être redite.
export const sayExactly = (sentence: string, situation: string) =>
  `Tu es l’examinateur d’une épreuve orale en français et tu parles uniquement en français. ${situation} Dis exactement cette phrase, en français, d’une voix calme, et rien d’autre : « ${sentence} »`;
// Les phrases de fin, enregistrées une fois pour toutes avec la voix de synthèse d’OpenAI (public/audio).
const CLOSING_AUDIO: Record<string, string> = {
  [CLOSING_SENTENCE]: "/audio/oral-fin.mp3",
  [ROLEPLAY_CLOSING_SENTENCE]: "/audio/oral-fin-tache2.mp3",
};

/** Joue la phrase de fin et l’ajoute à la transcription ; se résout quand elle est terminée. */
function playClosing(sentence: string, handlers: ExaminerHandlers): Promise<void> {
  return new Promise(resolve => {
    let finished = false;
    const finish = () => { if (finished) return; finished = true; clearTimeout(timer); handlers.onActivity("waiting"); resolve(); };
    const timer = setTimeout(finish, CLOSING_TIMEOUT_MS);
    handlers.onActivity("examiner");
    handlers.onTurn({ id: `fin-${Date.now()}`, role: "examiner", text: sentence, final: true });
    const source = CLOSING_AUDIO[sentence];
    if (!source || typeof Audio === "undefined") return void setTimeout(finish, 2_500);
    const player = new Audio(source);
    player.onended = finish;
    player.onerror = finish;
    player.play().catch(finish);
  });
}
// Tâche 2 : questions et réponses courtes, l’examinateur répond dès que la question est posée (2 s au plus).
// Pas d’interruption : un bruit ou l’écho de sa voix ne coupe plus l’examinateur au milieu d’un mot.
const QUESTIONS_TURN_DETECTION = { type: "semantic_vad", eagerness: "high", interrupt_response: false };

const CLOSING_TIMEOUT_MS = 12_000;

export type RealtimeEvent = { type: string; [key: string]: unknown };
type ResponseUsage = {
  input_token_details?: { audio_tokens?: number; text_tokens?: number; cached_tokens_details?: { audio_tokens?: number; text_tokens?: number } };
  output_token_details?: { audio_tokens?: number; text_tokens?: number };
};

/** Traduit un événement du serveur Realtime en état pour l’écran. Fonction pure : testée sans WebRTC. */
export function readEvent(event: RealtimeEvent, handlers: ExaminerHandlers) {
  switch (event.type) {
    case "input_audio_buffer.speech_started":
      handlers.onActivity("candidate");
      if (typeof event.item_id === "string") handlers.onTurn({ id: event.item_id, role: "candidate", text: "", final: false });
      break;
    case "input_audio_buffer.speech_stopped":
      handlers.onActivity("waiting");
      break;
    case "conversation.item.input_audio_transcription.delta":
      if (typeof event.item_id === "string" && typeof event.delta === "string")
        handlers.onTurn({ id: event.item_id, role: "candidate", text: "", final: false });
      break;
    case "conversation.item.input_audio_transcription.completed": {
      const text = String(event.transcript ?? "").trim();
      if (typeof event.item_id === "string") handlers.onTurn({ id: event.item_id, role: "candidate", text: notFrench(text) ? "" : text, final: true });
      // Selon le modèle de transcription, la consommation est déclarée en secondes ou en jetons.
      const usage = event.usage as { type?: string; seconds?: number; input_tokens?: number; output_tokens?: number } | undefined;
      if (usage?.type === "duration" && typeof usage.seconds === "number") handlers.onUsage({ transcription_seconds: usage.seconds });
      if (usage?.type === "tokens") handlers.onUsage({ transcription_in: usage.input_tokens ?? 0, transcription_out: usage.output_tokens ?? 0 });
      break;
    }
    case "output_audio_buffer.started":
      handlers.onActivity("examiner");
      break;
    case "output_audio_buffer.stopped":
      handlers.onActivity("waiting");
      break;
    case "response.output_audio_transcript.done":
      if (typeof event.item_id === "string") handlers.onTurn({ id: event.item_id, role: "examiner", text: String(event.transcript ?? "").trim(), final: true });
      break;
    case "response.done": {
      const usage = (event.response as { usage?: ResponseUsage } | undefined)?.usage;
      if (!usage) break;
      const cached = usage.input_token_details?.cached_tokens_details;
      const cachedAudio = cached?.audio_tokens ?? 0, cachedText = cached?.text_tokens ?? 0;
      handlers.onUsage({
        audio_in: Math.max(0, (usage.input_token_details?.audio_tokens ?? 0) - cachedAudio),
        cached_audio_in: cachedAudio,
        text_in: Math.max(0, (usage.input_token_details?.text_tokens ?? 0) - cachedText),
        cached_text_in: cachedText,
        audio_out: usage.output_token_details?.audio_tokens ?? 0,
        text_out: usage.output_token_details?.text_tokens ?? 0,
      });
      break;
    }
    case "error": {
      const error = event.error as { message?: string } | undefined;
      handlers.onError(error?.message ? `L’examinateur a rencontré un problème : ${error.message}` : "L’examinateur a rencontré un problème.");
      break;
    }
  }
}

/**
 * Économie : une réponse du candidat déjà transcrite et à laquelle l’examinateur a réagi est remplacée, dans la
 * mémoire de la conversation, par son texte. Sinon l’IA réécoute tout l’audio depuis le début à chaque relance
 * (10 $ le million de jetons audio, contre 0,60 $ en texte). Seule la dernière réponse reste en audio.
 * Fonction pure côté événements : testée sans WebRTC.
 */
export function audioToText(send: (event: RealtimeEvent) => void) {
  type Spoken = { previous: string | null; transcript?: string; answered: boolean };
  const spoken = new Map<string, Spoken>();   // réponses du candidat encore en audio
  const renamed = new Map<string, string>();  // réponse remplacée → son texte, pour garder l’ordre
  let count = 0;
  const flush = (responding: boolean) => {
    if (responding) return; // jamais pendant que l’examinateur répond
    for (const [id, item] of spoken) {
      if (!item.answered || item.transcript === undefined) continue;
      spoken.delete(id);
      if (!item.transcript.trim()) continue; // rien d’audible : on laisse l’audio
      const previous = item.previous ? renamed.get(item.previous) ?? item.previous : null;
      send({ type: "conversation.item.delete", item_id: id });
      // Un bruit « transcrit » en chinois, en anglais ou autre : retiré de la conversation, sans le remplacer.
      if (notFrench(item.transcript)) { renamed.set(id, previous ?? ""); continue; }
      const textId = `fl_txt_${++count}`;
      send({
        type: "conversation.item.create", ...(previous ? { previous_item_id: previous } : {}),
        item: { id: textId, type: "message", role: "user", content: [{ type: "input_text", text: `[Réponse orale du candidat, transcrite] ${item.transcript}` }] },
      });
      renamed.set(id, textId);
    }
  };
  return {
    read(event: RealtimeEvent, responding: boolean) {
      if (event.type === "input_audio_buffer.committed" && typeof event.item_id === "string")
        spoken.set(event.item_id, { previous: typeof event.previous_item_id === "string" ? event.previous_item_id : null, answered: false });
      else if (event.type === "conversation.item.input_audio_transcription.completed" && typeof event.item_id === "string") {
        const item = spoken.get(event.item_id);
        if (item) item.transcript = String(event.transcript ?? "");
      } else if (event.type === "response.done") {
        // L’examinateur a réagi à tout ce qui était déjà dit : ces réponses peuvent passer en texte.
        for (const item of spoken.values()) item.answered = true;
      } else return;
      flush(responding);
    },
  };
}

const REALTIME_CALLS = "https://api.openai.com/v1/realtime/calls";
const OPENING_RETRY_MS = 6_000;
const CONNECT_TIMEOUT_MS = 15_000;

/** Conversation réelle : micro → fournisseur, voix de l’examinateur ← fournisseur, événements par canal de données. */
export async function connectRealtime(session: SpeakingSession, microphone: MediaStream, handlers: ExaminerHandlers): Promise<ExaminerConnection> {
  const pc = new RTCPeerConnection();
  const audio = document.createElement("audio");
  audio.autoplay = true;
  pc.ontrack = event => {
    const stream = event.streams[0];
    if (!stream) return;
    audio.srcObject = stream;
    handlers.onRemoteStream?.(stream);
  };
  const track = microphone.getAudioTracks()[0];
  if (!track) throw new Error("Aucun microphone disponible.");
  pc.addTrack(track, microphone);
  const channel = pc.createDataChannel("oai-events");
  let responding = false, candidateSpeaking = false, opened = false, closed = false;
  const replacing = audioToText(event => send(event));
  channel.onmessage = message => {
    let event: RealtimeEvent;
    try { event = JSON.parse(String(message.data)); } catch { return; }
    if (event.type === "response.created") { responding = true; opened = true; }
    if (event.type === "response.done") responding = false;
    if (event.type === "input_audio_buffer.speech_started") candidateSpeaking = true;
    if (event.type === "input_audio_buffer.speech_stopped" || event.type === "input_audio_buffer.committed") candidateSpeaking = false;
    replacing.read(event, responding);
    readEvent(event, handlers);
  };
  const send = (event: RealtimeEvent) => { if (channel.readyState === "open") channel.send(JSON.stringify(event)); };
  // L’examinateur ouvre l’épreuve. Si le fournisseur n’a pas pris la demande en compte, elle est renvoyée une fois.
  channel.onopen = () => {
    send({ type: "response.create" });
    setTimeout(() => { if (!opened && !closed) send({ type: "response.create" }); }, OPENING_RETRY_MS);
  };
  let gone = false; // coupure signalée une seule fois ; une fermeture voulue par le site n’en est pas une
  const lost = () => { if (!closed && !gone) { gone = true; handlers.onLost?.(); } };
  pc.onconnectionstatechange = () => { if (pc.connectionState === "failed" || pc.connectionState === "closed") lost(); };
  channel.onclose = lost;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const response = await fetch(REALTIME_CALLS, {
    method: "POST",
    body: offer.sdp,
    headers: { Authorization: `Bearer ${session.client_secret}`, "Content-Type": "application/sdp" },
    // OpenAI qui ne répond pas : on abandonne vite au lieu de laisser le candidat attendre une minute.
    signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS),
  }).catch(() => null);
  if (!response?.ok) {
    closed = true;
    pc.close();
    throw new Error("Impossible de joindre l’examinateur. Vérifiez votre connexion, puis réessayez.");
  }
  await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });

  const close = () => {
    if (closed) return;
    closed = true;
    channel.close();
    pc.getSenders().forEach(sender => sender.track?.stop());
    pc.close();
    audio.srcObject = null;
  };
  return {
    microphone,
    setMuted: muted => { track.enabled = !muted; },
    startQuestions: () => {
      send({ type: "input_audio_buffer.clear" }); // rien de la préparation n’est écouté
      send({ type: "response.create", response: { instructions: sayExactly(QUESTIONS_SENTENCE, "La préparation du candidat est terminée.") } });
      send({ type: "session.update", session: { type: "realtime", audio: { input: { turn_detection: QUESTIONS_TURN_DETECTION } } } });
    },
    conclude: (sentence = CLOSING_SENTENCE) => {
      track.enabled = false; // le candidat n’est plus enregistré : ce qu’il dirait après la fin ne compte pas
      // Plus de réponse de l’IA : elle n’écoute plus, sa réponse en cours est annulée et sa voix est coupée.
      send({ type: "session.update", session: { type: "realtime", audio: { input: { turn_detection: null } } } });
      // Une phrase commencée avant la fin est quand même transcrite et comptée.
      if (candidateSpeaking) send({ type: "input_audio_buffer.commit" });
      if (responding) send({ type: "response.cancel" });
      send({ type: "output_audio_buffer.clear" });
      audio.muted = true;
      // La phrase d’au revoir est un enregistrement : toujours la même, une seule fois, en français, sans coût.
      return playClosing(sentence, handlers);
    },
    close,
  };
}

/** Questions de l’examinateur scripté, sans IA : pour construire l’écran et le tester sans clé ni coût. */
export const DEMO_SCRIPT: Record<number, string[]> = {
  1: [
    "Bonjour, je suis votre examinateur. Pour commencer, pouvez-vous vous présenter, s’il vous plaît ?",
    "Merci. Parlez-moi de votre travail ou de vos études.",
    "Et que faites-vous pendant votre temps libre ?",
    "Pourquoi souhaitez-vous vous installer au Canada ?",
  ],
  2: [
    "Bonjour. Lisez la consigne affichée à l’écran. Vous avez deux minutes pour préparer vos questions. Prenez des notes, je vous préviens quand nous commençons.",
    "Oui, bien sûr.",
    "D’accord, c’est noté.",
    "Du lundi au vendredi, de 8 h à 16 h.",
  ],
  3: [
    "Voici le sujet. Donnez votre point de vue, je vous écoute.",
    "Pouvez-vous donner un exemple précis ?",
    "Certaines personnes pensent le contraire. Que leur répondriez-vous ?",
  ],
};
export const DEMO_CLOSING = CLOSING_SENTENCE;
// L’examinateur scripté attend que le candidat ait fini : un silence de 2,5 s après avoir parlé.
const DEMO_SILENCE_MS = 2_500;
const DEMO_VOICE_LEVEL = 0.08;      // niveau sonore à partir duquel on considère que le candidat parle
const DEMO_NUDGE_MS = 30_000;       // sans un mot pendant 30 s, il passe quand même à la question suivante
const DEMO_MAX_TURN_MS = 120_000;   // une réponse ne dure jamais plus de 2 minutes

/** Examinateur scripté : la synthèse vocale du navigateur lit une question, puis attend que le candidat ait fini de parler. */
export function connectDemo(taskNumber: number, microphone: MediaStream, handlers: ExaminerHandlers, prep = false): ExaminerConnection {
  const lines = DEMO_SCRIPT[taskNumber] ?? DEMO_SCRIPT[1]!;
  const track = microphone.getAudioTracks()[0];
  let index = 0, timer: ReturnType<typeof setTimeout> | undefined, closed = false;
  // Écoute du micro : on sait quand le candidat parle et quand il s’est tu.
  let level = 0;
  const stopListening = watchLevel(microphone, value => { level = value; });
  const waitForAnswer = (then: () => void) => {
    const start = Date.now();
    let spoke = false, lastVoice = start;
    const check = () => {
      if (closed) return;
      const now = Date.now();
      if (track?.enabled !== false && level > DEMO_VOICE_LEVEL) { spoke = true; lastVoice = now; }
      const finished = spoke && now - lastVoice > DEMO_SILENCE_MS;
      if (finished || (!spoke && now - start > DEMO_NUDGE_MS) || now - start > DEMO_MAX_TURN_MS) then();
      else timer = setTimeout(check, 200);
    };
    timer = setTimeout(check, 200);
  };
  const say = (text: string, then?: () => void) => {
    const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    handlers.onActivity("examiner");
    handlers.onTurn({ id, role: "examiner", text, final: true });
    const finish = () => { if (!closed) then?.(); };
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    } else {
      timer = setTimeout(finish, 2_500);
    }
  };
  const next = () => {
    if (closed || index >= lines.length) { handlers.onActivity("candidate"); return; }
    say(lines[index++]!, () => {
      handlers.onActivity("candidate");
      waitForAnswer(next);
    });
  };
  // Avec préparation, la première phrase annonce les deux minutes : on n’attend pas de réponse.
  setTimeout(prep ? () => say(lines[index++]!, () => handlers.onActivity("waiting")) : next, 400);
  const stopSpeech = () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); };
  return {
    microphone,
    setMuted: muted => { if (track) track.enabled = !muted; },
    startQuestions: () => say(QUESTIONS_SENTENCE, () => { handlers.onActivity("candidate"); waitForAnswer(next); }),
    conclude: (sentence = DEMO_CLOSING) => new Promise<void>(resolve => {
      clearTimeout(timer);
      stopSpeech();
      if (track) track.enabled = false;
      say(sentence, resolve);
      setTimeout(resolve, CLOSING_TIMEOUT_MS);
    }),
    close: () => {
      closed = true;
      clearTimeout(timer);
      stopListening();
      stopSpeech();
      microphone.getTracks().forEach(t => t.stop());
    },
  };
}

/** Niveau sonore 0 à 1 d’un flux, lu en continu ; renvoie la fonction d’arrêt. */
export function watchLevel(stream: MediaStream, onLevel: (level: number) => void): () => void {
  let context: AudioContext;
  try { context = new AudioContext(); } catch { return () => {}; }
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  context.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let frame = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const value of data) { const centered = (value - 128) / 128; sum += centered * centered; }
    onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
    frame = requestAnimationFrame(tick);
  };
  tick();
  return () => { cancelAnimationFrame(frame); context.close().catch(() => {}); };
}
