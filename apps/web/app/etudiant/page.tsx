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
import { Notice, SectionTitle, SkillCards, Summary } from "../../features/student/ui";
import type { Progress } from "./progression/page";

export default function HomePage() {
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
  const rate = questions ? Math.round(correct / questions * 100) : 0;
  const open = attempts.filter(a => a.status === "active");
  const firstName = profile?.display_name?.split(" ")[0];
  const pending = !profile ? "—" : progress ? null : "…";
  return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="bienvenue">
        <span className="hero-chip">Lire. Écouter. Progresser.</span>
        <h2 id="bienvenue">{!ready ? "Bienvenue." : profile ? `Bon retour${firstName ? `, ${firstName}` : ""}.` : "Bienvenue sur Fluentia."}</h2>
        <p>{profile ? "Votre prochaine séance est prête. Chaque réponse validée est sauvegardée automatiquement dans votre profil." : "Connectez-vous pour sauvegarder chaque réponse, retrouver vos corrections et suivre vos résultats sur tous vos appareils."}</p>
        <div className="hero-actions">
          {ready && !profile && <Link className="hero-button" href="/etudiant/compte">Se connecter<Icon name="arrow" size={16} /></Link>}
          {open[0] && <Link className="hero-button" href={attemptHref(open[0])}>Reprendre ma séance<Icon name="arrow" size={16} /></Link>}
          {profile && !open[0] && <Link className="hero-button" href="#epreuves">Choisir une épreuve<Icon name="arrow" size={16} /></Link>}
          <Link className="hero-button hero-button-ghost" href="/etudiant/plan">Créer mon programme</Link>
        </div>
      </section>
      <section className="status-card" aria-labelledby="en-cours">
        <div className="status-head"><h2 id="en-cours">En cours</h2>{open.length > 0 && <span className="badge-warn"><Icon name="clock" size={14} />Échéance proche</span>}</div>
        <p className="status-value"><strong>{profile && !loading ? open.length : "—"}</strong> {open.length > 1 ? "séances ouvertes" : "séance ouverte"}</p>
        <p className="status-text">{!profile ? "Connectez-vous pour retrouver vos séances." : open.length ? "À terminer avant la fin du délai pour qu’elle soit comptabilisée." : "Aucune séance en attente : lancez une épreuve quand vous êtes prêt."}</p>
        <Image className="status-mark" src="/branding/01_Logos_PNG/fluentia-symbole-transparent-256.png" alt="" width={56} height={56} unoptimized />
      </section>
    </div>
    {profile && !profile.email_verified && <div style={{ marginTop: "1rem" }}><Notice icon="flag">Votre adresse e-mail n’est pas encore vérifiée. <Link href="/etudiant/compte">Ouvrir mon profil</Link></Notice></div>}
    <SectionTitle title="Votre bilan" />
    <Summary label="Votre bilan" items={[
      { label: "Séries terminées", value: pending ?? done, hint: "Tentatives envoyées" },
      { label: "Taux de réussite", value: pending ?? (questions ? `${rate} %` : "—"), hint: "Sur les réponses envoyées", meter: rate },
      { label: "Questions vues", value: pending ?? questions, hint: "Questions sautées incluses" },
      { label: "Séances ouvertes", value: !profile ? "—" : loading ? "…" : open.length, hint: "À clôturer avant l’échéance" },
    ]} />
    <div id="epreuves"><SectionTitle title="Choisir une épreuve" note="Les 4 épreuves du TCF, au format de l’examen" /></div>
    <SkillCards />
    <div className="two-col" style={{ marginTop: "2rem" }}>
      <section className="student-card" aria-labelledby="activites">
        <h2 id="activites">Mes séances</h2>
        {error && <p role="alert">{error}</p>}
        {!profile && <p>Vos séances apparaîtront ici après votre connexion.</p>}
        {profile && !loading && !attempts.length && <p>Aucune séance pour le moment. Choisissez une série ci-dessous pour commencer.</p>}
        {attempts.length > 0 && <ul className="activity-list">{attempts.map(attempt => <li key={attempt.id}>
          <span className="activity-title"><Link href={attemptHref(attempt)}>{attempt.exam_title} · {attempt.status === "submitted" ? "Voir ma correction" : attempt.status === "expired" ? "Temps écoulé" : "Reprendre"}</Link><small>{skillLabel(attempt.skill)} · {attempt.mode === "simulation" ? "Simulation" : "Entraînement"}</small></span>
          <span className={`pill ${attempt.status === "submitted" ? "pill-success" : attempt.status === "active" ? "pill-warning" : ""}`}>{attempt.status === "submitted" ? "Terminée" : attempt.status === "active" ? "En cours" : "Expirée"}</span>
        </li>)}</ul>}
        {more && <Button variant="secondary" loading={loading} onClick={() => { setError(""); setLoading(true); setOffset(attempts.length); }}>Afficher mes séances précédentes</Button>}
      </section>
      <section className="student-card card-muted" aria-labelledby="methode">
        <h2 id="methode">Votre méthode en trois temps</h2>
        <ul className="activity-list">
          <li><span className="activity-title"><strong>1. S’entraîner</strong><small>Séries courtes, corrections expliquées.</small></span><Icon name="book" /></li>
          <li><span className="activity-title"><strong>2. Se mettre en condition</strong><small>Simulations complètes et chronométrées.</small></span><Icon name="timer" /></li>
          <li><span className="activity-title"><strong>3. Analyser</strong><small>Repérez vos points forts et vos priorités.</small></span><Icon name="trend" /></li>
        </ul>
      </section>
    </div>
    <SectionTitle title="Séries disponibles" link={{ href: "/etudiant/examens-blancs", label: "Voir les simulations TCF" }} />
    <Catalogue />
    <p className="student-hint">Entraînements et simulations non officiels. Les difficultés affichées sont proposées par les auteurs et ne constituent pas un niveau certifié.</p>
  </>;
}
