"use client";
/** Studio d’expression écrite : brouillon local, compteur, minuteur, auto-évaluation et proposition de réponse ; la correction s’ouvre sur sa propre page. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, type ModelAnswer } from "../../lib/student-api";
import { useSession } from "../../lib/session";
import { countWords, formatDuration, type WritingTask } from "./content";
import { FoldableAside } from "./foldable-aside";

const criteria = ["J’ai respecté le type de texte et le destinataire.", "J’ai traité tous les points de la consigne.", "Mes idées sont organisées avec des connecteurs.", "J’ai varié le vocabulaire et évité les répétitions.", "J’ai relu l’accord, la conjugaison et la ponctuation."];

const MIN_WORDS = 20;

function read(key: string) { try { return localStorage.getItem(key) ?? ""; } catch { return ""; } }
function write(key: string, value: string) { try { localStorage.setItem(key, value); return true; } catch { return false; } }
const draftKey = (task: WritingTask, subject: number) => `fluentia-ee-${task.slug}-${subject}`;
// « Réessayer » et « Sujet suivant » ouvrent la tâche sur un sujet précis : ?sujet=<id>.
// Avec &vide=1, le brouillon est effacé pour repartir d’une page blanche ; le paramètre est retiré de l’adresse.
function requestedSubject(task: WritingTask) {
  const params = new URLSearchParams(window.location.search);
  const index = Math.max(0, task.subjects.findIndex(item => item.id === Number(params.get("sujet"))));
  if (params.has("vide")) write(draftKey(task, index), "");
  return index;
}

export function WritingStudio({ task, others, corrector }: { task: WritingTask; others: { slug: string; number: number; title: string }[]; corrector: string }) {
  const [subject, setSubject] = useState(() => requestedSubject(task));
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
  const [checks, setChecks] = useState<boolean[]>(criteria.map(() => false));
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
  useEffect(() => { setText(read(key)); loaded.current = key; setSaved(""); setChecks(criteria.map(() => false)); setCorrectionError(""); setAnswer(null); setShowAnswer(false); }, [key]);
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
    setChecks(criteria.map(() => false)); setRunning(false); setRemaining(task.minutes * 60);
    setRestarting(false);
  }
  return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="tache-titre">
        <span className="hero-chip-row"><span className="hero-chip">Tâche {task.number}</span><span>Rédaction · Expression écrite</span></span>
        <h1 id="tache-titre" className="epreuve-title"><Icon name="pen" size={30} />{task.title}</h1>
        <p>{task.genre}. Entre {task.min} et {task.max} mots, environ {task.minutes} minutes conseillées.</p>
      </section>
      <section className="status-card studio-timer" aria-labelledby="minuteur">
        <div className="status-head"><h2 id="minuteur" className="badge-warn"><Icon name="clock" size={14} />Minuteur</h2></div>
        <p className="studio-timer-value" aria-live="off">{formatDuration(remaining)}</p>
        <p className="status-text">{remaining === 0 ? "Temps conseillé écoulé. Terminez votre relecture." : `${task.minutes} minutes conseillées pour cette tâche.`}</p>
        <div className="studio-timer-actions">
          <Button onClick={() => setRunning(value => !value)} disabled={remaining === 0}><Icon name={running ? "pause" : "play"} size={14} />{running ? "Pause" : "Démarrer"}</Button>
          <Button variant="secondary" onClick={() => { setRunning(false); setRemaining(task.minutes * 60); }}><Icon name="refresh" size={14} />Réinitialiser</Button>
        </div>
      </section>
    </div>
    <div className="section-title"><h2>Votre sujet</h2>
      {task.subjects.length > 1 && <div className="series-filter" role="group" aria-label="Choisir un sujet">
        {task.subjects.map((item, index) => <button key={item.title} type="button" aria-pressed={subject === index} onClick={() => setSubject(index)}>{item.title}</button>)}
      </div>}
    </div>
    <div className="studio">
      <section className="student-card studio-main" aria-labelledby="consigne">
        <div className="prompt-card">
          <h2 id="consigne" className="student-eyebrow">Consigne</h2>
          <p>{current.prompt}</p>
          {current.documents && <div className="student-grid" style={{ marginTop: "1rem" }}>{current.documents.map(doc => <article key={doc.label} className="student-card" style={{ margin: 0 }}><h3>{doc.label}</h3><p>{doc.text}</p></article>)}</div>}
        </div>
        <label htmlFor="redaction" className="sr-only">Votre texte</label>
        <textarea id="redaction" className="writing-area" value={text} onChange={e => setText(e.target.value)} placeholder="Rédigez votre texte ici…" spellCheck={false} aria-describedby="compteur" />
        <div className="word-meter" id="compteur">
          <span><strong>{words}</strong> mots · cible {task.min}–{task.max}</span>
          {status && <span className={`pill ${status === "Dans la cible" ? "pill-success" : "pill-warning"}`}>{status}</span>}
          <span className="student-hint" aria-live="polite">{saved}</span>
        </div>
        <div className="correction-ask">
          {ready && !profile
            ? <Link className="button button-primary tile-link" href="/etudiant/compte">Se connecter pour faire corriger<Icon name="arrow" size={15} /></Link>
            : <>
              <Button loading={correcting} disabled={!ready || !corrector || !current.id || words < MIN_WORDS} onClick={requestCorrection}><Icon name="spark" size={15} />Corriger mon texte</Button>
              <Button variant="secondary" loading={answering} disabled={!ready || !corrector || !current.id} aria-expanded={showAnswer} onClick={toggleAnswer}><Icon name="book" size={15} />{showAnswer ? "Masquer la proposition" : "Proposition de réponse"}</Button>
            </>}
          <Dialog.Root open={restarting} onOpenChange={setRestarting}>
            <Dialog.Trigger asChild><Button variant="secondary" disabled={!text}><Icon name="refresh" size={15} />Recommencer</Button></Dialog.Trigger>
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
          <p className="student-hint">{words < MIN_WORDS ? `Écrivez au moins ${MIN_WORDS} mots pour demander une correction. ` : ""}{corrector ? `Votre texte est envoyé à ${corrector} pour être corrigé automatiquement.` : "La correction automatique n’est pas disponible pour le moment."}</p>
        </div>
        {(correcting || answering) && <p className="student-hint correction-wait" aria-live="polite">{correcting ? "Ouverture de la correction…" : "Rédaction de la proposition en cours…"}</p>}
        {correctionError && <p role="alert">{correctionError}</p>}
        {showAnswer && answer && <section className="correction" aria-labelledby="proposition-titre">
          <div className="studio-card-head"><h2 id="proposition-titre">Proposition de réponse</h2><span className="pill">{answer.words} mots</span>{answer.demo && <span className="pill pill-warning">Démonstration</span>}</div>
          <p className="correction-text">{answer.text}</p>
          <p className="student-hint">{answer.demo ? "Exemple de démonstration pour ce type de tâche : la vraie IA rédigera une réponse propre à ce sujet. " : ""}Inspirez-vous de la structure et des connecteurs, puis rédigez avec vos propres mots.</p>
        </section>}
      </section>
      <FoldableAside className="studio-aside" label="Outils de rédaction" tab="Outils">
        <section className="student-card" aria-labelledby="auto-evaluation">
          <div className="studio-card-head"><h2 id="auto-evaluation">Auto-évaluation</h2><span className="pill">{checks.filter(Boolean).length} / {criteria.length}</span></div>
          <ul className="checklist">{criteria.map((label, index) => <li key={label}><label><input type="checkbox" checked={checks[index]} onChange={e => setChecks(values => values.map((v, i) => i === index ? e.target.checked : v))} />{label}</label></li>)}</ul>
        </section>
        <section className="student-card card-muted" aria-labelledby="conseils">
          <div className="studio-card-head"><h2 id="conseils">Conseils</h2></div>
          <ul className="checklist">{task.advice.map(item => <li key={item}>{item}</li>)}</ul>
        </section>
        <nav className="student-card" aria-labelledby="autres-taches">
          <div className="studio-card-head"><h2 id="autres-taches">Autres tâches</h2></div>
          <ul className="activity-list">{others.map(t => <li key={t.slug}><Link href={`/etudiant/expression-ecrite/${t.slug}`}>Tâche {t.number} — {t.title}</Link><Icon name="chevron" size={16} /></li>)}</ul>
        </nav>
      </FoldableAside>
    </div>
  </>;
}
