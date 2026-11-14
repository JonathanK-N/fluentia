"use client";
/** Studio d’expression orale : le sujet, puis la tâche passée face à l’examinateur IA. */
import { useState } from "react";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { formatDuration, sentTo, type SpeakingTask } from "./content";
import { ExaminerSession } from "./examiner-session";

export function SpeakingStudio({ task, subject, examiner = "" }: { task: SpeakingTask; subject: number; others: { slug: string; number: number; title: string }[]; examiner?: string }) {
  const [withExaminer, setWithExaminer] = useState(false);
  const current = task.subjects[subject]!;

  return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="tache-titre">
        <span className="hero-chip-row"><span className="hero-chip">Tâche {task.number}</span><span>Oral · Expression orale</span></span>
        <h1 id="tache-titre" className="epreuve-title"><Icon name="mic" size={30} />{task.title}</h1>
        <p>{task.goal} Durée : {formatDuration(task.seconds)}{task.prepSeconds ? `, précédée de ${task.prepSeconds / 60} minutes de préparation` : ", sans préparation"}.</p>
      </section>
      <section className="status-card" aria-labelledby="bon-a-savoir">
        <div className="status-head"><h2 id="bon-a-savoir" className="badge-warn"><Icon name="clock" size={14} />Bon à savoir</h2></div>
        <p className="status-text notice-text">Pendant la conversation, votre voix est envoyée {sentTo(examiner)} pour être comprise et transcrite. Fluentia conserve uniquement la transcription.</p>
      </section>
    </div>
    <div className="section-title"><h2>Sujet {subject + 1} · {current.title}</h2></div>
    <div className="writing-intro">
        <section className="prompt-card" aria-labelledby="sujet">
          <h2 id="sujet" className="student-eyebrow">Sujet</h2>
          <p>{current.prompt}</p>
          <div className="pill-row" style={{ marginTop: ".9rem" }}>{current.cues.map(cue => <span className="pill" key={cue}>{cue}</span>)}</div>
        </section>
        <section className="examiner-launch" aria-labelledby="examinateur">
          <div>
            <h2 id="examinateur">Passer la tâche avec l’examinateur</h2>
            <p>Il vous parle, vous écoute et vous relance, dans le temps officiel.</p>
          </div>
          <Button onClick={() => setWithExaminer(true)}><Icon name="mic" size={18} />Commencer</Button>
        </section>
        {withExaminer && <ExaminerSession task={task} subject={current} examiner={examiner} onExit={() => setWithExaminer(false)} />}
    </div>
  </>;
}
