"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, type AttemptSummary } from "../../lib/student-api";
import { useSession } from "../../lib/session";
import { Catalogue } from "../../features/student/catalogue";
import { attemptHref, skillLabel } from "../../features/student/content";
import { Notice, SectionTitle, SkillCards, Stat } from "../../features/student/ui";
import type { Progress } from "./progression/page";

export default function DashboardPage() {
  const { profile, ready } = useSession();
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!profile) return;
    let active = true;
    api<{ results: AttemptSummary[]; next: string | null }>(`attempts/?limit=50&offset=${offset}`).then(data => {
      if (active) { setAttempts(previous => offset ? [...previous, ...data.results] : data.results); setMore(Boolean(data.next)); }
    }).catch(e => { if (active && e.status !== 403) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offset, profile]);
  useEffect(() => {
    if (!profile) return;
    api<Progress>("progress/").then(setProgress).catch(() => setProgress(null));
  }, [profile]);
  const groups = progress?.groups ?? [];
  const done = groups.reduce((sum, g) => sum + g.attempts, 0);
  const questions = groups.reduce((sum, g) => sum + g.questions, 0);
  const correct = groups.reduce((sum, g) => sum + g.correct, 0);
  const activeAttempts = attempts.filter(a => a.status === "active");
  const firstName = profile?.display_name?.split(" ")[0];
  const empty = !profile ? "—" : progress ? null : "…";
  return <>
    <section className="welcome" aria-labelledby="bienvenue">
      <div>
        <p className="student-eyebrow">Un texte. Une étape. Des progrès.</p>
        <h1 id="bienvenue">{!ready ? "Bienvenue" : profile ? `Bonjour ${firstName || ""}`.trim() : "Bienvenue sur Fluentia"}</h1>
        <p>{profile ? "Votre prochain entraînement vous attend. Chaque réponse confirmée est enregistrée sur votre compte." : "Connectez-vous pour enregistrer vos réponses, retrouver vos corrigés et suivre votre progression sur tous vos appareils."}</p>
        <div className="actions">
          {ready && !profile && <Link className="button button-primary tile-link" href="/etudiant/compte">Se connecter ou créer un compte</Link>}
          {activeAttempts[0] && <Link className="button button-primary tile-link" href={attemptHref(activeAttempts[0])}>Continuer mon activité en cours</Link>}
          {profile && !activeAttempts[0] && <Link className="button button-primary tile-link" href="/etudiant/examens-blancs">Passer un examen blanc</Link>}
          <Link className="button button-secondary tile-link" href="/etudiant/plan">Construire mon plan d’étude</Link>
        </div>
      </div>
      <Image className="welcome-mark" src="/branding/01_Logos_PNG/fluentia-symbole-transparent-256.png" alt="" width={120} height={120} unoptimized />
    </section>
    {profile && !profile.email_verified && <div style={{ marginTop: "1rem" }}><Notice icon="flag">Votre adresse e-mail n’est pas encore vérifiée. <Link href="/etudiant/compte">Gérer mon compte</Link></Notice></div>}
    <div className="stats" aria-label="Indicateurs personnels">
      <Stat icon="exam" label="Exercices terminés" value={empty ?? done} hint="Tentatives soumises" />
      <Stat icon="target" label="Score moyen" value={empty ?? (questions ? `${Math.round(correct / questions * 100)} %` : "—")} hint="Sur les questions soumises" />
      <Stat icon="check" label="Questions traitées" value={empty ?? questions} hint="Omissions comprises" />
      <Stat icon="clock" label="Activités en cours" value={!profile ? "—" : loading ? "…" : activeAttempts.length} hint="À terminer avant le délai" />
    </div>
    <SectionTitle title="Accès rapide aux compétences" />
    <SkillCards />
    <div className="two-col" style={{ marginTop: "2rem" }}>
      <section className="student-card" aria-labelledby="activites">
        <h2 id="activites">Retrouver mes activités</h2>
        {error && <p role="alert">{error}</p>}
        {!profile && <p>Vos tentatives apparaîtront ici après votre connexion.</p>}
        {profile && !loading && !attempts.length && <p>Aucune activité pour le moment. Choisissez un exercice ci-dessous pour commencer.</p>}
        {attempts.length > 0 && <ul className="activity-list">{attempts.map(attempt => <li key={attempt.id}>
          <span className="activity-title"><Link href={attemptHref(attempt)}>{attempt.exam_title} · {attempt.status === "submitted" ? "Voir mon corrigé" : attempt.status === "expired" ? "Temps écoulé" : "Reprendre"}</Link><small>{skillLabel(attempt.skill)} · {attempt.mode === "simulation" ? "Simulation" : "Entraînement"}</small></span>
          <span className={`pill ${attempt.status === "submitted" ? "pill-success" : attempt.status === "active" ? "pill-warning" : ""}`}>{attempt.status === "submitted" ? "Terminé" : attempt.status === "active" ? "En cours" : "Expiré"}</span>
        </li>)}</ul>}
        {more && <Button variant="secondary" loading={loading} onClick={() => { setError(""); setLoading(true); setOffset(attempts.length); }}>Afficher mes activités précédentes</Button>}
      </section>
      <section className="student-card card-muted" aria-labelledby="methode">
        <h2 id="methode">Votre méthode en trois temps</h2>
        <ul className="activity-list">
          <li><span className="activity-title"><strong>1. S’entraîner</strong><small>Exercices courts, corrigés expliqués.</small></span><Icon name="book" /></li>
          <li><span className="activity-title"><strong>2. Se mettre en condition</strong><small>Simulations complètes et chronométrées.</small></span><Icon name="clock" /></li>
          <li><span className="activity-title"><strong>3. Analyser</strong><small>Repérez vos points forts et vos priorités.</small></span><Icon name="chart" /></li>
        </ul>
      </section>
    </div>
    <SectionTitle title="Exercices disponibles" link={{ href: "/etudiant/examens-blancs", label: "Voir les examens blancs" }} />
    <Catalogue />
    <p className="student-hint">Entraînements et simulations non officiels. Les difficultés affichées sont proposées par les auteurs et ne constituent pas un niveau certifié.</p>
  </>;
}
