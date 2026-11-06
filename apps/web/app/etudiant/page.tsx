"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "../../components/app-shell/icons";
import { api, type AttemptSummary } from "../../lib/student-api";
import { useSession } from "../../lib/session";
import { attemptHref } from "../../features/student/content";
import { Notice, SectionTitle, SkillCards, Summary } from "../../features/student/ui";
import type { Progress } from "./progression/page";

export default function HomePage() {
  const { profile, ready } = useSession();
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  // Séances ouvertes : alimentent le bandeau « Reprendre ma séance » et la carte « En cours ».
  useEffect(() => {
    if (!profile) return;
    let active = true;
    api<{ results: AttemptSummary[] }>("attempts/?limit=50").then(data => { if (active) setAttempts(data.results); })
      .catch(() => { if (active) setAttempts([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [profile]);
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
    <section className="student-card card-muted" aria-labelledby="methode" style={{ marginTop: "2rem" }}>
      <h2 id="methode">Votre méthode en trois temps</h2>
      <ul className="activity-list">
        <li><span className="activity-title"><strong>1. S’entraîner</strong><small>Séries courtes, corrections expliquées.</small></span><Icon name="book" /></li>
        <li><span className="activity-title"><strong>2. Se mettre en condition</strong><small>Simulations complètes et chronométrées.</small></span><Icon name="timer" /></li>
        <li><span className="activity-title"><strong>3. Analyser</strong><small>Repérez vos points forts et vos priorités.</small></span><Icon name="trend" /></li>
      </ul>
    </section>
  </>;
}
