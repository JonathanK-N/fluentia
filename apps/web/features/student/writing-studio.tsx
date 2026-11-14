"use client";
/** Séance de Rédaction, sur le modèle de l’Oral : brouillon local, compteur, minuteur, auto-évaluation et proposition de réponse ; la correction s’ouvre sur sa propre page. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, type ModelAnswer } from "../../lib/student-api";
import { useSession } from "../../lib/session";
import { countWords, draftKey as subjectDraftKey, sentTo, type WritingTask } from "./content";
import { Ring, SeanceBar, SeanceHead, Timer } from "./seance";


const MIN_WORDS = 20;

function read(key: string) { try { return localStorage.getItem(key) ?? ""; } catch { return ""; } }
function write(key: string, value: string) { try { localStorage.setItem(key, value); return true; } catch { return false; } }
const draftKey = (task: WritingTask, subject: number) => subjectDraftKey(task.slug, subject);
// Le sujet est choisi dans la liste de la tâche et arrive par l’adresse : ?sujet=<id>.
// Avec &vide=1 (« Réessayer »), le brouillon est effacé pour repartir d’une page blanche ; le paramètre est retiré de l’adresse.
function clearIfRequested(task: WritingTask, subject: number) {
  if (new URLSearchParams(window.location.search).has("vide")) write(draftKey(task, subject), "");
  return subject;
}

export function WritingStudio({ task, subject: chosen, corrector }: { task: WritingTask; subject: number; others?: { slug: string; number: number; title: string }[]; corrector: string }) {
  // D’abord la page du sujet ; « Commencer » ouvre la séance plein écran.
  const [started, setStarted] = useState(false);
  const [menu, setMenu] = useState(false);
  const [subject] = useState(() => clearIfRequested(task, chosen));
  const router = useRouter();
  // Après l’affichage (pas pendant) : modifier l’adresse en plein rendu dérange le routeur de Next.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("vide")) return;
    params.delete("vide");
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }, []);
  const key = draftKey(task, subject);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [remaining, setRemaining] = useState(task.minutes * 60);
  const [running, setRunning] = useState(false);
  const { profile, ready } = useSession();
  const [correcting, setCorrecting] = useState(false);
  const [correctionError, setCorrectionError] = useState("");
  const [answer, setAnswer] = useState<ModelAnswer | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const loaded = useRef("");
  useEffect(() => { setText(read(key)); loaded.current = key; setSaved(""); setCorrectionError(""); setAnswer(null); setShowAnswer(false); }, [key]);
  useEffect(() => {
    if (loaded.current !== key) return;
    const timer = setTimeout(() => { if (write(key, text)) setSaved(text ? "Brouillon enregistré sur cet appareil." : ""); }, 600);
    return () => clearTimeout(timer);
  }, [key, text]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setRemaining(value => { if (value <= 1) { setRunning(false); return 0; } return value - 1; }), 1000);
    return () => clearInterval(timer);
  }, [running]);
  const words = countWords(text);
  const status = words === 0 ? "" : words < task.min ? "Encore un peu court" : words > task.max ? "Au-delà de la cible" : "Dans la cible";
  const current = task.subjects[subject]!;
  async function requestCorrection() {
    if (!current.id) return;
    setCorrecting(true); setCorrectionError("");
    try {
      const created = await api<{ id: number }>(`tasks/writing/subjects/${current.id}/correction/`, "POST", { text });
      // Le texte corrigé est gardé avec sa correction : en revenant sur le sujet, on repart d’une page blanche.
      loaded.current = "";
      write(key, "");
      router.push(`/etudiant/expression-ecrite/correction/${created.id}`);
    }
    catch (e) { setCorrectionError((e as Error).message); setCorrecting(false); }
  }
  async function toggleAnswer() {
    if (showAnswer) { setShowAnswer(false); return; }
    if (!answer && current.id) {
      setAnswering(true); setCorrectionError("");
      try { setAnswer(await api<ModelAnswer>(`tasks/writing/subjects/${current.id}/model-answer/`)); }
      catch (e) { setCorrectionError((e as Error).message); setAnswering(false); return; }
      setAnswering(false);
    }
    setShowAnswer(true);
  }
  function restart() {
    setText(""); write(key, ""); setSaved("");
    setCorrectionError(""); setShowAnswer(false);
    setRunning(false); setRemaining(task.minutes * 60);
    setRestarting(false);
  }
  // Séance plein écran, comme l’Oral, la Lecture et l’Écoute : le menu du site est masqué.
  useEffect(() => {
    if (!started) return;
    document.documentElement.dataset.examFocus = "";
    window.scrollTo(0, 0);
    return () => { delete document.documentElement.dataset.examFocus; delete document.documentElement.dataset.examMenu; };
  }, [started]);
  useEffect(() => {
    if (menu) document.documentElement.dataset.examMenu = "";
    else delete document.documentElement.dataset.examMenu;
  }, [menu]);
  const total = task.minutes * 60;
  const tone = !words ? undefined : status === "Dans la cible" ? "mint" : "warn";

  if (!started) return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="tache-titre">
        <span className="hero-chip-row"><span className="hero-chip">Tâche {task.number}</span><span>Rédaction · Expression écrite</span></span>
        <h1 id="tache-titre" className="epreuve-title"><Icon name="pen" size={30} />{task.title}</h1>
        <p>{task.genre}. Entre {task.min} et {task.max} mots, environ {task.minutes} minutes conseillées.</p>
      </section>
      <section className="status-card" aria-labelledby="bon-a-savoir">
        <div className="status-head"><h2 id="bon-a-savoir" className="badge-warn"><Icon name="clock" size={14} />Bon à savoir</h2></div>
        <p className="status-text notice-text">Votre brouillon est enregistré sur cet appareil. {corrector ? `Quand vous demandez une correction, votre texte est envoyé ${sentTo(corrector)} pour être corrigé automatiquement.` : "La correction automatique n’est pas disponible pour le moment."}</p>
      </section>
    </div>
    <div className="section-title"><h2>Sujet {subject + 1} · {current.title}</h2></div>
    <div className="writing-intro">
        <section className="prompt-card" aria-labelledby="sujet">
          <h2 id="sujet" className="student-eyebrow">Consigne</h2>
          <p>{current.prompt}</p>
          {current.documents && <div className="writing-documents">{current.documents.map(doc => <article key={doc.label}><h3>{doc.label}</h3><p>{doc.text}</p></article>)}</div>}
          <div className="pill-row" style={{ marginTop: ".9rem" }}><span className="pill">{task.min}–{task.max} mots</span><span className="pill">{task.minutes} min conseillées</span></div>
        </section>
        <section className="examiner-launch" aria-labelledby="lancer">
          <div>
            <h2 id="lancer">{text ? "Reprendre votre texte" : "Rédiger ce sujet"}</h2>
            <p>{text ? `Votre brouillon de ${words} mot${words > 1 ? "s" : ""} vous attend.` : "En plein écran, avec le compteur de mots et le minuteur."}</p>
          </div>
          <Button onClick={() => setStarted(true)}><Icon name="pen" size={18} />{text ? "Reprendre" : "Commencer"}</Button>
        </section>
    </div>
  </>;

  return <div className="seance">
    <SeanceBar label="Rédaction" menuOpen={menu} onMenu={() => setMenu(value => !value)}>
      <button type="button" className="seance-quit" onClick={() => { setRunning(false); setMenu(false); setStarted(false); }}><Icon name="close" size={14} />Quitter la séance</button>
    </SeanceBar>
    <div className="seance-body oral-body writing-body">
      <SeanceHead
        chips={[{ label: "Épreuve 03" }, { label: "Entraînement non officiel", tone: "warn" }]}
        title={current.title}
        subtitle={`${task.title} · ${task.genre} · entre ${task.min} et ${task.max} mots`}
        current={task.number}
      />

      <section className="oral-card oral-card-wide" aria-labelledby="seance-title">
        <div className="oral-visual">
          <div className="oral-orb-wrap">
            <Ring label="Mots" value={String(words)} caption={`cible ${task.min}–${task.max}`} progress={words / task.max} ariaLabel={`${words} mots sur une cible de ${task.min} à ${task.max}`} />
            <p className="oral-pill" data-tone={tone} aria-live="polite"><span aria-hidden="true" />{status || "Commencez à écrire"}</p>
          </div>
          <div className="oral-orb-wrap">
            <Timer left={remaining} progress={remaining / total} label={remaining === 0 ? "Terminé" : "Minuteur"} total={total} />
            <div className="writing-timer-actions">
              <Button variant="secondary" onClick={() => setRunning(value => !value)} disabled={remaining === 0}><Icon name={running ? "pause" : "play"} size={14} />{running ? "Pause" : "Démarrer"}</Button>
              <Button variant="ghost" aria-label="Réinitialiser le minuteur" onClick={() => { setRunning(false); setRemaining(total); }}><Icon name="refresh" size={14} /></Button>
            </div>
          </div>
        </div>

        <div className="oral-message">
          <span className="oral-message-icon" aria-hidden="true"><Icon name="pen" size={16} /></span>
          <div>
            <small>Consigne · sujet {subject + 1}</small>
            <p>{current.prompt}</p>
            {current.documents && <div className="writing-documents">{current.documents.map(doc => <article key={doc.label}><h3>{doc.label}</h3><p>{doc.text}</p></article>)}</div>}
          </div>
        </div>

        <div className="writing-field">
          <label htmlFor="redaction" className="sr-only">Votre texte</label>
          <textarea id="redaction" className="writing-area" value={text} onChange={e => setText(e.target.value)} placeholder="Rédigez votre texte ici…" spellCheck={false} aria-describedby="compteur" />
          <p className="student-hint" id="compteur" aria-live="polite">{words} mot{words > 1 ? "s" : ""} · cible {task.min}–{task.max}{saved ? ` · ${saved}` : ""}</p>
        </div>


        {showAnswer && answer && <section className="oral-message writing-answer" aria-labelledby="proposition-titre">
          <span className="oral-message-icon" aria-hidden="true"><Icon name="book" size={16} /></span>
          <div>
            <small id="proposition-titre">Proposition de réponse · {answer.words} mots{answer.demo ? " · démonstration" : ""}</small>
            <p>{answer.text}</p>
            <p className="student-hint">{answer.demo ? "Exemple de démonstration pour ce type de tâche : la vraie IA rédigera une réponse propre à ce sujet. " : ""}Inspirez-vous de la structure et des connecteurs, puis rédigez avec vos propres mots.</p>
          </div>
        </section>}

        {(correcting || answering) && <p className="student-hint correction-wait" aria-live="polite">{correcting ? "Ouverture de la correction…" : "Rédaction de la proposition en cours…"}</p>}
        {correctionError && <p role="alert" className="examiner-error">{correctionError}</p>}

        <div className="oral-actions">
          <Dialog.Root open={restarting} onOpenChange={setRestarting}>
            <Dialog.Trigger asChild><Button variant="secondary" disabled={!text}><Icon name="refresh" size={16} />Recommencer</Button></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="dialog-overlay" />
              <Dialog.Content className="dialog-content quit-dialog">
                <Dialog.Title>Recommencer ce sujet ?</Dialog.Title>
                <Dialog.Description>Votre texte, l’auto-évaluation et le minuteur repartent de zéro. Le brouillon enregistré sur cet appareil est effacé.</Dialog.Description>
                <div className="quit-actions">
                  <Button onClick={restart}>Effacer et recommencer</Button>
                  <Dialog.Close asChild><Button variant="secondary">Garder mon texte</Button></Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          {ready && !profile
            ? <Link className="button button-primary" href="/etudiant/compte">Se connecter pour faire corriger<Icon name="arrow" size={16} /></Link>
            : <>
              <Button variant="secondary" className="oral-toggle" loading={answering} disabled={!ready || !corrector || !current.id} aria-pressed={showAnswer} onClick={toggleAnswer}><Icon name="book" size={16} />Proposition de réponse</Button>
              <Button loading={correcting} disabled={!ready || !corrector || !current.id || words < MIN_WORDS} onClick={requestCorrection}>Corriger mon texte<Icon name="arrow" size={16} /></Button>
            </>}
        </div>
        <p className="student-hint writing-note">{words < MIN_WORDS ? `Écrivez au moins ${MIN_WORDS} mots pour demander une correction. ` : ""}{corrector ? `Votre texte est envoyé ${sentTo(corrector)} pour être corrigé automatiquement.` : "La correction automatique n’est pas disponible pour le moment."}</p>
      </section>
    </div>
  </div>;
}
