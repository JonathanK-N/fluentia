/**
 * Conversation vocale avec l’examinateur IA.
 *
 * Le navigateur parle directement au fournisseur en WebRTC avec la clé éphémère créée par le serveur :
 * la clé d’API de Fluentia ne quitte jamais le serveur. Le fournisseur « demo » ne contacte rien :
 * un examinateur scripté lit ses questions avec la synthèse vocale du navigateur.
 */

export type Speaker = "examiner" | "candidate";
export type Turn = { id: string; role: Speaker; text: string; final: boolean };
export type Usage = { audio_in: number; cached_audio_in: number; text_in: number; audio_out: number; text_out: number; transcription_seconds: number };
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
};

export type ExaminerConnection = {
  microphone: MediaStream;
  setMuted: (muted: boolean) => void;
  /** Demande à l’examinateur de conclure poliment ; se résout quand il a fini de parler (ou après le délai). */
  conclude: () => Promise<void>;
  close: () => void;
};

export const emptyUsage = (): Usage => ({ audio_in: 0, cached_audio_in: 0, text_in: 0, audio_out: 0, text_out: 0, transcription_seconds: 0 });

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

export const CLOSING_INSTRUCTIONS =
  "Le temps de l’épreuve est écoulé. Remercie le candidat en une seule phrase courte, sans aucune évaluation, et termine l’entretien.";

const CLOSING_TIMEOUT_MS = 12_000;

type RealtimeEvent = { type: string; [key: string]: unknown };
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
      if (typeof event.item_id === "string") handlers.onTurn({ id: event.item_id, role: "candidate", text: String(event.transcript ?? "").trim(), final: true });
      const usage = event.usage as { type?: string; seconds?: number } | undefined;
      if (usage?.type === "duration" && typeof usage.seconds === "number") handlers.onUsage({ transcription_seconds: usage.seconds });
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
      const cachedAudio = cached?.audio_tokens ?? 0;
      handlers.onUsage({
        audio_in: Math.max(0, (usage.input_token_details?.audio_tokens ?? 0) - cachedAudio),
        cached_audio_in: cachedAudio,
        text_in: usage.input_token_details?.text_tokens ?? 0,
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

const REALTIME_CALLS = "https://api.openai.com/v1/realtime/calls";

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
  const waiters: ((event: RealtimeEvent) => void)[] = [];
  let responding = false;
  channel.onmessage = message => {
    let event: RealtimeEvent;
    try { event = JSON.parse(String(message.data)); } catch { return; }
    if (event.type === "response.created") responding = true;
    if (event.type === "response.done") responding = false;
    readEvent(event, handlers);
    waiters.slice().forEach(wait => wait(event));
  };
  const send = (event: RealtimeEvent) => { if (channel.readyState === "open") channel.send(JSON.stringify(event)); };
  channel.onopen = () => send({ type: "response.create" }); // l’examinateur ouvre l’épreuve
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed") handlers.onError("La connexion avec l’examinateur a été perdue. Vérifiez votre réseau.");
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const response = await fetch(REALTIME_CALLS, {
    method: "POST",
    body: offer.sdp,
    headers: { Authorization: `Bearer ${session.client_secret}`, "Content-Type": "application/sdp" },
  }).catch(() => null);
  if (!response?.ok) {
    pc.close();
    throw new Error("Impossible de joindre l’examinateur. Vérifiez votre connexion, puis réessayez.");
  }
  await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });

  let closed = false;
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
    conclude: () => new Promise<void>(resolve => {
      track.enabled = false; // le candidat n’est plus enregistré pendant la conclusion
      let asked = false, answered = false;
      const ask = () => { asked = true; send({ type: "response.create", response: { instructions: CLOSING_INSTRUCTIONS } }); };
      const done = () => { const i = waiters.indexOf(wait); if (i >= 0) waiters.splice(i, 1); clearTimeout(timer); resolve(); };
      const wait = (event: RealtimeEvent) => {
        // Une réponse en cours est d’abord annulée : l’API refuse une deuxième réponse simultanée.
        if (!asked && event.type === "response.done") ask();
        else if (asked && event.type === "response.created") answered = true;
        else if (answered && event.type === "output_audio_buffer.stopped") done();
      };
      const timer = setTimeout(done, CLOSING_TIMEOUT_MS);
      waiters.push(wait);
      if (responding) send({ type: "response.cancel" });
      else ask();
    }),
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
    "Bonjour, je vous écoute. Quelles informations souhaitez-vous obtenir ?",
    "Oui, bien sûr. Avez-vous d’autres questions ?",
    "C’est une bonne question. Que voulez-vous savoir d’autre ?",
  ],
  3: [
    "Voici le sujet. Donnez votre point de vue, je vous écoute.",
    "Pouvez-vous donner un exemple précis ?",
    "Certaines personnes pensent le contraire. Que leur répondriez-vous ?",
  ],
};
export const DEMO_CLOSING = "Merci, l’épreuve est terminée.";
const DEMO_LISTEN_MS = 15_000;

/** Examinateur scripté : la synthèse vocale du navigateur lit une question, puis laisse 15 secondes au candidat. */
export function connectDemo(taskNumber: number, microphone: MediaStream, handlers: ExaminerHandlers): ExaminerConnection {
  const lines = DEMO_SCRIPT[taskNumber] ?? DEMO_SCRIPT[1]!;
  const track = microphone.getAudioTracks()[0];
  let index = 0, timer: ReturnType<typeof setTimeout> | undefined, closed = false;
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
      timer = setTimeout(next, DEMO_LISTEN_MS);
    });
  };
  setTimeout(next, 400);
  const stopSpeech = () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); };
  return {
    microphone,
    setMuted: muted => { if (track) track.enabled = !muted; },
    conclude: () => new Promise<void>(resolve => {
      clearTimeout(timer);
      stopSpeech();
      if (track) track.enabled = false;
      say(DEMO_CLOSING, resolve);
      setTimeout(resolve, CLOSING_TIMEOUT_MS);
    }),
    close: () => {
      closed = true;
      clearTimeout(timer);
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
