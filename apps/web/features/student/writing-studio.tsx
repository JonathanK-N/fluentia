"use client";
/** Studio d’expression écrite : brouillon local, compteur, minuteur et auto-évaluation. Aucune note n’est calculée. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { countWords, formatDuration, writingTasks, type WritingTask } from "./content";
import { PageHead } from "./ui";

const criteria = ["J’ai respecté le type de texte et le destinataire.", "J’ai traité tous les points de la consigne.", "Mes idées sont organisées avec des connecteurs.", "J’ai varié le vocabulaire et évité les répétitions.", "J’ai relu l’accord, la conjugaison et la ponctuation."];

function read(key: string) { try { return localStorage.getItem(key) ?? ""; } catch { return ""; } }
function write(key: string, value: string) { try { localStorage.setItem(key, value); return true; } catch { return false; } }

export function WritingStudio({ task }: { task: WritingTask }) {
  const [subject, setSubject] = useState(0);
  const key = `fluentia-ee-${task.slug}-${subject}`;
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [checks, setChecks] = useState<boolean[]>(criteria.map(() => false));
  const [remaining, setRemaining] = useState(task.minutes * 60);
  const [running, setRunning] = useState(false);
  const loaded = useRef("");
  useEffect(() => { setText(read(key)); loaded.current = key; setSaved(""); setChecks(criteria.map(() => false)); }, [key]);
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
  function download() {
    const url = URL.createObjectURL(new Blob([`${current.title}\n\n${text}\n`], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `fluentia-expression-ecrite-${task.slug}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <PageHead eyebrow={`Expression écrite · Tâche ${task.number}`} title={task.title}>{task.genre}. Entre {task.min} et {task.max} mots, environ {task.minutes} minutes conseillées.</PageHead>
    <div className="segmented" role="group" aria-label="Choisir un sujet">
      {task.subjects.map((item, index) => <Button key={item.title} variant="ghost" aria-pressed={subject === index} onClick={() => setSubject(index)}>{item.title}</Button>)}
    </div>
    <div className="studio">
      <div>
        <section className="prompt-card" aria-labelledby="consigne">
          <h2 id="consigne" className="student-eyebrow">Consigne</h2>
          <p>{current.prompt}</p>
          {current.documents && <div className="student-grid" style={{ marginTop: "1rem" }}>{current.documents.map(doc => <article key={doc.label} className="student-card" style={{ margin: 0 }}><h3>{doc.label}</h3><p>{doc.text}</p></article>)}</div>}
        </section>
        <div style={{ marginTop: "1rem" }}>
          <label htmlFor="redaction" className="sr-only">Votre texte</label>
          <textarea id="redaction" className="writing-area" value={text} onChange={e => setText(e.target.value)} placeholder="Rédigez votre texte ici…" spellCheck={false} aria-describedby="compteur" />
          <div className="word-meter" id="compteur">
            <span><strong>{words}</strong> mots · cible {task.min}–{task.max}</span>
            {status && <span className={`pill ${status === "Dans la cible" ? "pill-success" : "pill-warning"}`}>{status}</span>}
            <span className="student-hint" aria-live="polite">{saved}</span>
          </div>
          <div className="student-nav" style={{ marginTop: "1rem" }}>
            <Button variant="secondary" disabled={!text} onClick={() => navigator.clipboard?.writeText(text)}><Icon name="copy" size={16} />Copier</Button>
            <Button variant="secondary" disabled={!text} onClick={download}><Icon name="download" size={16} />Télécharger</Button>
            <Button variant="ghost" disabled={!text} onClick={() => setText("")}><Icon name="trash" size={16} />Effacer le brouillon</Button>
          </div>
        </div>
      </div>
      <aside className="studio-aside" aria-label="Outils de rédaction">
        <section className="student-card">
          <h2 className="student-eyebrow">Minuteur</h2>
          <p className="big-timer" aria-live="off">{formatDuration(remaining)}</p>
          <p className="student-hint">{remaining === 0 ? "Temps conseillé écoulé. Terminez votre relecture." : `${task.minutes} minutes conseillées pour cette tâche.`}</p>
          <div className="student-nav" style={{ margin: 0 }}>
            <Button onClick={() => setRunning(value => !value)} disabled={remaining === 0}>{running ? "Pause" : "Démarrer"}</Button>
            <Button variant="secondary" onClick={() => { setRunning(false); setRemaining(task.minutes * 60); }}>Réinitialiser</Button>
          </div>
        </section>
        <section className="student-card">
          <h2 className="student-eyebrow">Auto-évaluation</h2>
          <ul className="checklist">{criteria.map((label, index) => <li key={label}><label><input type="checkbox" checked={checks[index]} onChange={e => setChecks(values => values.map((v, i) => i === index ? e.target.checked : v))} />{label}</label></li>)}</ul>
          <p className="student-hint" style={{ marginTop: ".75rem" }}>{checks.filter(Boolean).length} / {criteria.length} critères vérifiés. L’évaluation détaillée par un correcteur arrivera dans une prochaine version.</p>
        </section>
        <section className="student-card card-muted">
          <h2 className="student-eyebrow">Conseils</h2>
          <ul className="checklist">{task.advice.map(item => <li key={item}>{item}</li>)}</ul>
        </section>
        <nav aria-label="Autres tâches d’expression écrite" className="student-card">
          <h2 className="student-eyebrow">Autres tâches</h2>
          <ul className="checklist">{writingTasks.filter(t => t.slug !== task.slug).map(t => <li key={t.slug}><Link href={`/etudiant/expression-ecrite/${t.slug}`}>Tâche {t.number} — {t.title}</Link></li>)}</ul>
        </nav>
      </aside>
    </div>
  </>;
}
