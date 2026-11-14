"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "../../../components/app-shell/icons";
import { api } from "../../../lib/student-api";
import { useSession } from "../../../lib/session";
import { Notice, PageHero, SectionTitle, Summary } from "../../../features/student/ui";

export type SkillLevel = { skill: "reading" | "listening" | "writing" | "speaking"; tests: number; level: string | null; last_score: number | null; last_unit: string | null };
export type Progress = {
  disclaimer: string;
  groups: { skill: string; mode: string; attempts: number; correct: number; questions: number; percentage: number }[];
  categories: { skill: string; difficulty: string; answered: number; correct: number }[];
  level: { level: string | null; tests: number };
  skills: SkillLevel[];
  explored: { seen: number; total: number };
};
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

const SKILLS: Record<SkillLevel["skill"], { label: string; the: string; of: string; href: string; icon: IconName }> = {
  reading: { label: "Lecture", the: "la Lecture", of: "de Lecture", href: "/etudiant/comprehension-ecrite", icon: "book" },
  listening: { label: "Écoute", the: "l’Écoute", of: "d’Écoute", href: "/etudiant/comprehension-orale", icon: "headphones" },
  writing: { label: "Rédaction", the: "la Rédaction", of: "de Rédaction", href: "/etudiant/expression-ecrite", icon: "pen" },
  speaking: { label: "Oral", the: "l’Oral", of: "d’Oral", href: "/etudiant/expression-orale", icon: "mic" },
};
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
/** Une épreuve n’est jugée qu’à partir de trois tests : en dessous, le niveau dépend trop d’un seul essai. */
const ENOUGH = 3;

/** Épreuve à travailler : la plus faible parmi celles assez pratiquées, sinon celle qui n’a pas encore été essayée. */
function focus(skills: SkillLevel[]) {
  const judged = skills.filter(s => s.tests >= ENOUGH && s.level);
  if (judged.length > 1) {
    const weakest = [...judged].sort((a, b) => LEVELS.indexOf(a.level!) - LEVELS.indexOf(b.level!) || a.tests - b.tests)[0]!;
    return { skill: weakest, text: `Travaillez ${SKILLS[weakest.skill].the} : c’est votre épreuve la plus faible (${weakest.level}).` };
  }
  const missing = [...skills].sort((a, b) => a.tests - b.tests)[0];
  if (!missing) return null;
  return { skill: missing, text: missing.tests
    ? `Faites encore quelques tests ${SKILLS[missing.skill].of} : à partir de ${ENOUGH}, nous pourrons comparer vos épreuves.`
    : `Essayez ${SKILLS[missing.skill].the} : vous ne l’avez pas encore travaillée.` };
}

export default function ProgressPage() {
  const { profile, ready } = useSession();
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Progress>("progress/").then(setData).catch(e => setError(e.message)); }, [profile]);
  const skills = data?.skills ?? [];
  const next = data ? focus(skills) : null;
  const judged = skills.filter(s => s.tests >= ENOUGH && s.level);
  const weakest = judged.length > 1 && next?.text.startsWith("Travaillez") ? next.skill : null;
  return <>
    <PageHero chip="Mes résultats" title="Vos étapes, à votre rythme"
      actions={<><Link className="hero-button" href="/etudiant#epreuves">Choisir une épreuve<Icon name="arrow" size={16} /></Link><Link className="hero-button hero-button-ghost" href="/etudiant/plan">Ajuster mon programme</Link></>}
      asideTitle="Recommandation" aside={next
        ? <><span>{next.text}</span> <Link className="aside-link" href={SKILLS[next.skill.skill].href}>Aller à {SKILLS[next.skill.skill].the}<Icon name="arrow" size={14} /></Link></>
        : "Faites un premier test pour recevoir une recommandation."}>
      Seuls vos tests envoyés et corrigés alimentent ces indicateurs. Les niveaux sont des estimations, pas des résultats officiels du TCF.
    </PageHero>
    {ready && !profile && <div style={{ marginTop: "1rem" }}><Notice icon="user">Connectez-vous pour consulter vos résultats. <Link href="/etudiant/compte">Accéder à la connexion</Link></Notice></div>}
    {error && profile && <p role="alert">{error}</p>}
    {!data && !error && <p className="student-hint">Chargement de vos résultats…</p>}
    {data && <>
      <SectionTitle title="Votre bilan" />
      <Summary label="Votre bilan" items={[
        { label: "Niveau moyen", value: data.level.level ?? "—", hint: data.level.tests ? "Toutes épreuves · estimation non officielle" : "Après un premier test" },
        { label: "Tests envoyés", value: data.level.tests, hint: "Lecture, Écoute, Rédaction et Oral" },
        { label: "Épreuve à travailler", value: weakest ? `${SKILLS[weakest.skill].label} · ${weakest.level}` : "—",
          hint: weakest ? "Votre niveau le plus bas" : `Après ${ENOUGH} tests dans au moins deux épreuves` },
      ]} />
      {!data.level.tests && <div className="empty-block" style={{ marginTop: "1.25rem" }}><h2>Votre première étape vous attend</h2><p>Terminez un exercice pour retrouver ici vos résultats.</p><Link className="button button-primary tile-link" href="/etudiant#epreuves">Choisir un exercice</Link></div>}
      <SectionTitle title="Par épreuve" note="Niveau moyen de vos tests dans chaque épreuve" />
      <div className="series-grid skill-levels">{skills.map(s => {
        const info = SKILLS[s.skill];
        return <article className="series-card" key={s.skill}>
          <div className="series-card-top"><span className="skill-chip"><Icon name={info.icon} size={18} /></span>{s.tests > 0 && s.tests < ENOUGH && <span className="series-kind">Peu de tests</span>}</div>
          <h3>{info.label}</h3>
          <p className="skill-level"><strong>{s.level ?? "—"}</strong><span>{s.tests ? `niveau moyen sur ${plural(s.tests, "test")}` : "aucun test pour l’instant"}</span></p>
          <p className="student-hint">{s.last_score !== null ? `Dernier test : ${s.last_score}${s.last_unit === "%" ? " % de bonnes réponses" : "/20"}` : "\u00a0"}</p>
          <Link className="button button-secondary tile-link" href={info.href}>{s.tests ? "S’entraîner" : "Commencer"}<Icon name="arrow" size={14} /></Link>
        </article>;
      })}</div>
    </>}
  </>;
}
