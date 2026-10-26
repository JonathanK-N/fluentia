"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/student-api";
type Progress = {disclaimer: string; groups: {skill: string; mode: string; attempts: number; correct: number; questions: number; percentage: number}[]; categories: {skill: string; difficulty: string; answered: number; correct: number}[]};
export default function ProgressPage() {
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {api<Progress>("progress/").then(setData).catch(e => setError(e.message));}, []);
  return <><h1>Vos étapes, à votre rythme</h1><p>Seules vos tentatives soumises alimentent ces indicateurs.</p>{error && <p role="alert">{error}</p>}{!data && !error && <p role="status">Chargement de vos résultats…</p>}
    {data && <><p>{data.disclaimer}</p>{!data.groups.length && <section className="student-card"><h2>Votre première étape vous attend</h2><p>Terminez un exercice pour retrouver ici vos résultats.</p></section>}
      <div className="student-grid">{data.groups.map(g => <section className="student-card" key={g.skill + g.mode}><h2>{g.skill === "listening" ? "Compréhension orale" : "Compréhension écrite"}</h2><p>{g.mode === "simulation" ? "Simulations" : "Entraînements"} · {g.attempts} tentatives</p><p>{g.correct} / {g.questions} réponses correctes · {g.percentage} %</p></section>)}</div>
      {!!data.categories.length && <section className="student-card"><h2>Repères pour votre prochaine séance</h2><p>Les difficultés sont proposées par les auteurs, sans calibration. Les questions non répondues sont incluses dans les totaux d’examen, pas dans cette répartition des réponses.</p><ul>{data.categories.map(c => <li key={c.skill + c.difficulty}>{c.skill === "listening" ? "Oral" : "Lecture"} · {c.difficulty === "non_calibree" ? "Difficulté non calibrée" : c.difficulty} : {c.correct} / {c.answered} réponses correctes</li>)}</ul></section>}
    </>}
  </>;
}
