"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/student-api";
import { useSession } from "../../../lib/session";
import { skillLabel } from "../../../features/student/content";
import { Bar, Notice, PageHead, Stat } from "../../../features/student/ui";

export type Progress = { disclaimer: string; groups: { skill: string; mode: string; attempts: number; correct: number; questions: number; percentage: number }[]; categories: { skill: string; difficulty: string; answered: number; correct: number }[] };
const order = ["non_calibree", "A1", "A2", "B1", "B2", "C1", "C2"];

export default function ProgressPage() {
  const { profile, ready } = useSession();
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Progress>("progress/").then(setData).catch(e => setError(e.message)); }, [profile]);
  const total = data?.groups.reduce((acc, g) => ({ attempts: acc.attempts + g.attempts, correct: acc.correct + g.correct, questions: acc.questions + g.questions }), { attempts: 0, correct: 0, questions: 0 });
  const best = data?.groups.length ? [...data.groups].sort((a, b) => b.percentage - a.percentage)[0] : null;
  const categories = [...(data?.categories ?? [])].sort((a, b) => a.skill.localeCompare(b.skill) || order.indexOf(a.difficulty) - order.indexOf(b.difficulty));
  return <>
    <PageHead eyebrow="Mes résultats" title="Vos étapes, à votre rythme">Seules vos tentatives soumises alimentent ces indicateurs. Aucune progression fictive n’est affichée.</PageHead>
    {ready && !profile && <Notice icon="user">Connectez-vous pour consulter vos résultats. <Link href="/etudiant/compte">Accéder à la connexion</Link></Notice>}
    {error && profile && <p role="alert">{error}</p>}
    {!data && !error && <p className="student-hint">Chargement de vos résultats…</p>}
    {data && total && <>
      <div className="stats" aria-label="Synthèse">
        <Stat icon="exam" label="Tentatives soumises" value={total.attempts} />
        <Stat icon="target" label="Réussite globale" value={total.questions ? `${Math.round(total.correct / total.questions * 100)} %` : "—"} hint={`${total.correct} / ${total.questions} questions`} />
        <Stat icon="chart" label="Meilleur domaine" value={best ? `${best.percentage} %` : "—"} hint={best ? `${skillLabel(best.skill)} · ${best.mode === "simulation" ? "simulations" : "entraînements"}` : "Après une première tentative"} />
      </div>
      {!data.groups.length && <div className="empty-block"><h2>Votre première étape vous attend</h2><p>Terminez un exercice pour retrouver ici vos résultats.</p><Link className="button button-primary tile-link" href="/etudiant">Choisir un exercice</Link></div>}
      {!!data.groups.length && <div className="two-col">
        <section className="student-card" aria-labelledby="par-domaine">
          <h2 id="par-domaine" className="sr-only">Résultats par compétence</h2>
          <p className="student-eyebrow">Taux de réussite par compétence et par mode</p>
          <div className="student-grid">{data.groups.map(g => <section className="student-card" key={g.skill + g.mode}>
            <h2>{skillLabel(g.skill)}</h2>
            <p>{g.mode === "simulation" ? "Simulations" : "Entraînements"} · {g.attempts} tentatives</p>
            <ul className="bar-list"><Bar label="Réussite" value={g.percentage} detail={`${g.percentage} %`} /></ul>
            <p style={{ marginTop: ".6rem" }}>{g.correct} / {g.questions} réponses correctes · {g.percentage} %</p>
          </section>)}</div>
        </section>
        <section className="student-card card-muted" aria-labelledby="conseil">
          <h2 id="conseil">Prochaine séance</h2>
          <p>{best && data.groups.length > 1 ? "Alternez votre domaine le plus solide avec celui qui progresse le moins : la régularité compte davantage que la durée." : "Variez les compétences : une séance de lecture et une séance d’écoute chaque semaine donnent des repères comparables."}</p>
          <p><Link href="/etudiant/plan">Ajuster mon programme</Link></p>
          <p className="student-hint">{data.disclaimer}</p>
        </section>
      </div>}
      {!!categories.length && <section className="student-card" aria-labelledby="reperes">
        <h2 id="reperes">Repères pour votre prochaine séance</h2>
        <p>Les difficultés sont proposées par les auteurs, sans calibration. Les questions non répondues sont incluses dans les totaux d’examen, pas dans cette répartition des réponses.</p>
        <ul className="bar-list">{categories.map(c => <Bar key={c.skill + c.difficulty} label={`${skillLabel(c.skill)} · ${c.difficulty === "non_calibree" ? "Difficulté non calibrée" : c.difficulty}`} value={c.answered ? c.correct / c.answered * 100 : 0} detail={`${c.correct} / ${c.answered}`} />)}</ul>
        <details style={{ marginTop: "1rem" }}><summary>Afficher le tableau détaillé</summary>
          <div className="table-scroll"><table><caption className="sr-only">Réponses correctes par difficulté proposée</caption><thead><tr><th scope="col">Compétence</th><th scope="col">Difficulté</th><th scope="col">Correctes</th><th scope="col">Répondues</th></tr></thead>
            <tbody>{categories.map(c => <tr key={c.skill + c.difficulty}><th scope="row">{skillLabel(c.skill)}</th><td>{c.difficulty === "non_calibree" ? "Non calibrée" : c.difficulty}</td><td>{c.correct}</td><td>{c.answered}</td></tr>)}</tbody></table></div>
        </details>
      </section>}
    </>}
  </>;
}
