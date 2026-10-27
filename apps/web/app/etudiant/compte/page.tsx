"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/primitives";
import { Icon } from "../../../components/app-shell/icons";
import { api, type Profile } from "../../../lib/student-api";
import { initials, useSession } from "../../../lib/session";

const benefits = ["Vos réponses enregistrées à chaque choix, reprise sur tous vos appareils.", "Des corrigés expliqués après chaque exercice soumis.", "Une progression calculée uniquement sur vos résultats réels."];

export default function AccountPage() {
  const { profile, ready, setProfile } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (profile) { setProfile(await api<Profile>("auth/profile/", "PATCH", values)); setMessage("Votre profil est enregistré."); }
      else if (mode === "login") { setProfile(await api<Profile>("auth/login/", "POST", values)); }
      else { const data = await api<{ detail: string }>("auth/register/", "POST", values); setMessage(data.detail + " Consultez votre boîte e-mail, puis connectez-vous."); }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError("");
    try { const data = await api<{ detail: string }>("auth/verification/resend/", "POST"); setMessage(data.detail); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function signout() {
    setBusy(true); setError("");
    try { await api("auth/logout/", "POST"); setProfile(null); setMessage("Vous êtes déconnecté."); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function switchMode(next: "login" | "register") { setMode(next); setError(""); setMessage(""); }
  return <div className="auth-layout">
    <aside className="auth-aside" aria-label="Avantages du compte">
      <div>
        <p className="student-eyebrow">Votre espace Fluentia</p>
        <p style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>Préparez le TCF à votre rythme, sans perdre une seule réponse.</p>
      </div>
      <ul>{benefits.map(item => <li key={item}><Icon name="check" size={18} /><span>{item}</span></li>)}</ul>
      <p className="student-hint" style={{ margin: 0 }}>Exercices originaux et non officiels. Aucune donnée n’est revendue.</p>
    </aside>
    <section className="student-card auth-panel">
      {profile && <div className="shell-user" style={{ marginBottom: "1.25rem", background: "var(--sand)" }}><span className="shell-avatar" aria-hidden="true">{initials(profile)}</span><div><strong>{profile.display_name || "Mon profil"}</strong><span>{profile.email_verified ? "Adresse vérifiée" : "Adresse à vérifier"}</span></div></div>}
      <h1>{profile ? "Mon profil étudiant" : mode === "login" ? "Content de vous retrouver" : "Un premier pas vers vos objectifs"}</h1>
      <p>{profile ? profile.email : "Enregistrez vos réponses et reprenez votre entraînement à votre rythme."}</p>
      {!ready ? <p className="student-hint">Chargement de la session…</p> : <>
        {!profile && <div className="segmented" role="group" aria-label="Mode d’accès" style={{ marginTop: ".5rem" }}>
          <Button variant="ghost" aria-pressed={mode === "login"} disabled={busy} onClick={() => switchMode("login")}>Connexion</Button>
          <Button variant="ghost" aria-pressed={mode === "register"} disabled={busy} onClick={() => switchMode("register")}>Inscription</Button>
        </div>}
        <form onSubmit={submit} className="student-form">
          {(profile || mode === "register") && <label>Prénom ou nom d’usage<input name="display_name" autoComplete="nickname" maxLength={80} required defaultValue={profile?.display_name ?? ""} /></label>}
          {!profile && <>
            <label>Adresse e-mail<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
            <label>Mot de passe<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 12 : undefined} maxLength={128} required /></label>
            {mode === "register" && <p className="student-hint">Au moins 12 caractères. Évitez les mots de passe courants et vos informations personnelles.</p>}
          </>}
          <Button type="submit" loading={busy}>{profile ? "Enregistrer mon profil" : mode === "login" ? "Se connecter" : "Créer mon compte"}</Button>
        </form>
        {profile && <div style={{ display: "grid", gap: ".75rem" }}>
          <div className="app-notice"><Icon name={profile.email_verified ? "check" : "flag"} size={18} /><p>{profile.email_verified ? "Adresse e-mail vérifiée." : "Vérifiez votre adresse e-mail pour commencer un exercice."}</p></div>
          <div className="student-nav" style={{ margin: 0 }}>
            {!profile.email_verified && <Button variant="secondary" disabled={busy} onClick={resend}>Renvoyer le lien de vérification</Button>}
            {profile.email_verified && <Link className="button button-secondary tile-link" href="/etudiant">Choisir un exercice</Link>}
            <Button variant="ghost" disabled={busy} onClick={signout}><Icon name="logout" size={16} />Se déconnecter</Button>
          </div>
        </div>}
      </>}
      <p role="status" className="student-save-status">{message}</p>{error && <p role="alert">{error}</p>}
    </section>
  </div>;
}
