"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "../../../components/app-shell/icons";
import { api } from "../../../lib/student-api";
import { useSession } from "../../../lib/session";
import { skillLabel } from "../../../features/student/content";
import { Bar, Notice, PageHero, SectionTitle, Summary } from "../../../features/student/ui";

type Graded = { count: number; last_score: number | null; last_level: string | null };
export type Progress = {
  disclaimer: string;
  groups: { skill: string; mode: string; attempts: number; correct: number; questions: number; percentage: number }[];
  categories: { skill: string; difficulty: string; answered: number; correct: number }[];
  writing: Graded;
  speaking: Graded & { attempts_left: number | null; attempts_total: number | null };
};
const order = ["non_calibree", "A1", "A2", "B1", "B2", "C1", "C2"];
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

export default function ProgressPage() {
  const { profile, ready } = useSession();
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Progress>("progress/").then(setData).catch(e => setError(e.message)); }, [profile]);
  const total = data?.groups.reduce((acc, g) => ({ attempts: acc.attempts + g.attempts, correct: acc.correct + g.correct, questions: acc.questions + g.questions }), { attempts: 0, correct: 0, questions: 0 });
  const rate = total?.questions ? Math.round(total.correct / total.questions * 100) : 0;
  const best = data?.groups.length ? [...data.groups].sort((a, b) => b.percentage - a.percentage)[0] : null;
  const categories = [...(data?.categories ?? [])].sort((a, b) => a.skill.localeCompare(b.skill) || order.indexOf(a.difficulty) - order.indexOf(b.difficulty));
  const advice = best && data && data.groups.length > 1
    ? "Alternez votre domaine le plus solide avec celui qui progresse le moins : la régularité compte davantage que la durée."
    : "Variez les compétences : une séance de lecture et une séance d’écoute chaque semaine donnent des repères comparables.";
  return <>
    <PageHero chip="Mes résultats" title="Vos étapes, à votre rythme"
      actions={<><Link className="hero-button" href="/etudiant#epreuves">Choisir une épreuve<Icon name="arrow" size={16} /></Link><Link className="hero-button hero-button-ghost" href="/etudiant/plan">Ajuster mon programme</Link></>}
      asideTitle="Prochaine séance" aside={advice}>
      Seules vos tentatives soumises alimentent ces indicateurs. Aucune progression fictive n’est affichée.
    </PageHero>
    {ready && !profile && <div style={{ marginTop: "1rem" }}><Notice icon="user">Connectez-vous pour consulter vos résultats. <Link href="/etudiant/compte">Accéder à la connexion</Link></Notice></div>}
    {error && profile && <p role="alert">{error}</p>}
    {!data && !error && <p className="student-hint">Chargement de vos résultats…</p>}
    {data && total && <>
      <SectionTitle title="Votre bilan" />
      <Summary label="Votre bilan" items={[
        { label: "Tentatives soumises", value: total.attempts, hint: "Entraînements et simulations" },
        { label: "Réussite globale", value: total.questions ? `${rate} %` : "—", hint: `${total.correct} / ${total.questions} questions`, meter: rate },
        { label: "Meilleur domaine", value: best ? `${Math.round(best.percentage)} %` : "—", hint: best ? `${skillLabel(best.skill)} · ${best.mode === "simulation" ? "simulations" : "entraînements"}` : "Après une première tentative" },
      ]} />
      {!data.groups.length && <div className="empty-block" style={{ marginTop: "1.25rem" }}><h2>Votre première étape vous attend</h2><p>Terminez un exercice pour retrouver ici vos résultats.</p><Link className="button button-primary tile-link" href="/etudiant#epreuves">Choisir un exercice</Link></div>}
      {!!data.groups.length && <>
        <SectionTitle title="Par compétence" note="Taux de réussite par épreuve et par mode" />
        <div className="series-grid">{data.groups.map(g => <article className="series-card" key={g.skill + g.mode}>
          <div className="series-card-top"><span className="series-kind" data-mode={g.mode === "simulation" ? "simulation" : "training"}>{g.mode === "simulation" ? "Simulations" : "Entraînements"}</span></div>
          <h3>{skillLabel(g.skill)}</h3>
          <p>{plural(g.attempts, "tentative")} · {g.correct} / {g.questions} réponses correctes</p>
          <ul className="bar-list"><Bar label="Réussite" value={g.percentage} detail={`${Math.round(g.percentage)} %`} /></ul>
        </article>)}</div>
      </>}
      {!!categories.length && <>
        <SectionTitle title="Par difficulté" note="Difficultés proposées par les auteurs, sans calibration" />
        <section className="student-card" aria-label="Réussite par difficulté" style={{ marginTop: 0 }}>
          <ul className="bar-list">{categories.map(c => <Bar key={c.skill + c.difficulty} label={`${skillLabel(c.skill)} · ${c.difficulty === "non_calibree" ? "Difficulté non calibrée" : c.difficulty}`} value={c.answered ? c.correct / c.answered * 100 : 0} detail={`${c.correct} / ${c.answered}`} />)}</ul>
          <details style={{ marginTop: "1rem" }}><summary>Afficher le tableau détaillé</summary>
            <div className="table-scroll"><table><caption className="sr-only">Réponses correctes par difficulté proposée</caption><thead><tr><th scope="col">Compétence</th><th scope="col">Difficulté</th><th scope="col">Correctes</th><th scope="col">Répondues</th></tr></thead>
              <tbody>{categories.map(c => <tr key={c.skill + c.difficulty}><th scope="row">{skillLabel(c.skill)}</th><td>{c.difficulty === "non_calibree" ? "Non calibrée" : c.difficulty}</td><td>{c.correct}</td><td>{c.answered}</td></tr>)}</tbody></table></div>
          </details>
          <p className="student-hint" style={{ marginTop: "1rem" }}>Les questions non répondues comptent dans les totaux d’examen, pas dans cette répartition. {data.disclaimer}</p>
        </section>
      </>}
    </>}
  </>;
}
