"use client";
import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/primitives";
import { Icon } from "../../../components/app-shell/icons";
import { api, type Profile } from "../../../lib/student-api";
import { initials, useSession } from "../../../lib/session";
import { SectionTitle, Summary } from "../../../features/student/ui";

const benefits = ["Vos réponses enregistrées à chaque choix, reprise sur tous vos appareils.", "Des corrections expliquées après chaque série envoyée.", "Des résultats calculés uniquement sur vos réponses réelles."];
const longDate = (value: string) => new Date(value.length === 10 ? value + "T12:00:00" : value).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });

function Switch({ id, label, hint, checked, disabled, onChange, icon }: { id: string; label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void; icon?: "volume" }) {
  return <div className="setting-row" data-nested={icon ? "" : undefined}>
    <span className="setting-text">{icon && <Icon name={icon} size={15} />}<span><strong id={id}>{label}</strong><small>{hint}</small></span></span>
    <button type="button" role="switch" className="switch" aria-checked={checked} aria-labelledby={id} disabled={disabled} onClick={() => onChange(!checked)}><span /></button>
  </div>;
}

function Connected({ profile, busy, act, setMessage }: { profile: Profile; busy: boolean; act: (work: () => Promise<Profile | null>, done?: string) => void; setMessage: (value: string) => void }) {
  const sub = profile.subscription;
  const badge = { premium: "Membre Premium", expired: "Premium expiré", free: "Formule gratuite" }[sub.status];
  const days = `${sub.days_remaining} ${sub.days_remaining > 1 ? "jours" : "jour"}`;
  function prefer(field: "live_correction" | "answer_sound", value: boolean) {
    act(() => api<Profile>("auth/profile/", "PATCH", { [field]: value }), "Réglage enregistré.");
  }
  return <>
    <section className="profile-banner" aria-labelledby="identite">
      <span className="profile-avatar" aria-hidden="true">{initials(profile)}</span>
      <div><h2 id="identite">{profile.display_name || "Mon profil"}</h2><p>{profile.email}</p></div>
      <div className="profile-banner-actions">
        <span className="profile-badge" data-status={sub.status}><Icon name="trophy" size={14} />{badge}</span>
        <button type="button" className="profile-logout" disabled={busy} onClick={() => act(async () => { await api("auth/logout/", "POST"); return null; }, "Vous êtes déconnecté.")}><Icon name="logout" size={15} />Se déconnecter</button>
      </div>
    </section>
    {!profile.email_verified && <div className="app-notice verify-notice"><Icon name="flag" size={18} /><p>Vérifiez votre adresse e-mail pour commencer un exercice.</p>
      <Button variant="secondary" disabled={busy} onClick={() => act(async () => { const data = await api<{ detail: string }>("auth/verification/resend/", "POST"); setMessage(data.detail); return null; })}>Renvoyer le lien de vérification</Button></div>}
    <SectionTitle title="Mon abonnement" />
    <Summary label="Mon abonnement" items={[
      { label: "Temps restant", value: sub.status === "premium" ? days : "—", hint: sub.status === "premium" ? "Avant la fin du Premium" : "Aucun Premium en cours" },
      { label: "Valable jusqu’au", value: sub.premium_until ? longDate(sub.premium_until) : "—", hint: sub.status === "premium" ? "Premium actif" : sub.status === "expired" ? "Premium terminé" : "Formule gratuite" },
      { label: "Identifiant", value: <span className="summary-email">{profile.email}</span>, hint: "Adresse de connexion" },
    ]} />
    <div className="student-nav" style={{ marginTop: "1rem" }}>
      <Button onClick={() => setMessage("Le paiement en ligne ouvrira prochainement. En attendant, l’équipe Fluentia active le Premium sur demande depuis l’administration.")}><Icon name="refresh" size={16} />{sub.status === "free" ? "Passer au Premium" : "Renouveler mon Premium"}</Button>
    </div>
    <section className="student-card settings-card" aria-labelledby="reglages">
      <div className="card-title"><span className="skill-chip"><Icon name="sliders" size={18} /></span><h2 id="reglages">Réglages d’entraînement</h2></div>
      <p>Pendant les QCM, la correction en direct indique tout de suite si votre réponse est juste. Désactivez-la pour vous mettre en conditions d’examen : rien n’est révélé avant la fin.</p>
      <div className="settings">
        <Switch id="reglage-correction" label="Correction en direct" hint="Juste ou faux après chaque réponse" checked={profile.preferences.live_correction} disabled={busy} onChange={value => prefer("live_correction", value)} />
        <Switch id="reglage-son" label="Signal sonore" hint="Un son pour chaque bonne ou mauvaise réponse" icon="volume" checked={profile.preferences.answer_sound} disabled={busy || !profile.preferences.live_correction} onChange={value => prefer("answer_sound", value)} />
      </div>
    </section>
  </>;
}

export default function AccountPage() {
  const { profile, ready, setProfile, refresh } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function act(work: () => Promise<Profile | null>, done?: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await work();
      if (result) setProfile(result); else if (done === "Vous êtes déconnecté.") setProfile(null); else await refresh();
      if (done) setMessage(done);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (mode === "login") act(() => api<Profile>("auth/login/", "POST", values));
    else act(async () => { const data = await api<{ detail: string }>("auth/register/", "POST", values); setMessage(data.detail + " Consultez votre boîte e-mail, puis connectez-vous."); return null; });
  }
  function switchMode(next: "login" | "register") { setMode(next); setError(""); setMessage(""); }
  const status = <><p role="status" className="student-save-status">{message}</p>{error && <p role="alert">{error}</p>}</>;
  if (!ready) return <p className="student-hint">Chargement de la session…</p>;
  if (profile) return <><Connected profile={profile} busy={busy} act={act} setMessage={setMessage} />{status}</>;
  return <div className="auth-layout">
    <aside className="auth-aside" aria-label="Avantages du compte">
      <div>
        <p className="student-eyebrow">Votre espace Fluentia</p>
        <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>Préparez le TCF à votre rythme, sans perdre une seule réponse.</p>
      </div>
      <ul>{benefits.map(item => <li key={item}><Icon name="check" size={18} /><span>{item}</span></li>)}</ul>
      <p className="student-hint" style={{ margin: 0 }}>Exercices originaux et non officiels. Aucune donnée n’est revendue.</p>
    </aside>
    <section className="student-card auth-panel">
      <h2 className="page-title">{mode === "login" ? "Content de vous retrouver" : "Un premier pas vers vos objectifs"}</h2>
      <p>Enregistrez vos réponses et reprenez votre entraînement à votre rythme.</p>
      <div className="segmented" role="group" aria-label="Mode d’accès" style={{ marginTop: ".5rem" }}>
        <Button variant="ghost" aria-pressed={mode === "login"} disabled={busy} onClick={() => switchMode("login")}>Connexion</Button>
        <Button variant="ghost" aria-pressed={mode === "register"} disabled={busy} onClick={() => switchMode("register")}>Inscription</Button>
      </div>
      <form onSubmit={authenticate} className="student-form">
        {mode === "register" && <label>Prénom ou nom d’usage<input name="display_name" autoComplete="nickname" maxLength={80} required /></label>}
        <label>Adresse e-mail<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>Mot de passe<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 12 : undefined} maxLength={128} required /></label>
        {mode === "register" && <p className="student-hint">Au moins 12 caractères. Évitez les mots de passe courants et vos informations personnelles.</p>}
        <Button type="submit" loading={busy}>{mode === "login" ? "Se connecter" : "Créer mon compte"}</Button>
      </form>
      {status}
    </section>
  </div>;
}
