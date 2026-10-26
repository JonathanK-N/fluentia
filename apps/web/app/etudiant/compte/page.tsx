"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/primitives";
import { api, type Profile } from "../../../lib/student-api";

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api<Profile>("auth/profile/").then(setProfile).catch(() => {}).finally(() => setReady(true)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (profile) { setProfile(await api<Profile>("auth/profile/", "PATCH", values)); setMessage("Votre profil est enregistré."); }
      else if (mode === "login") { setProfile(await api<Profile>("auth/login/", "POST", values)); }
      else { const data = await api<{detail: string}>("auth/register/", "POST", values); setMessage(data.detail + " Consultez votre boîte e-mail, puis connectez-vous."); }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError("");
    try { const data = await api<{detail: string}>("auth/verification/resend/", "POST"); setMessage(data.detail); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function signout() {
    setBusy(true); setError("");
    try { await api("auth/logout/", "POST"); setProfile(null); setMessage("Vous êtes déconnecté."); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="student-card account-card">
    <p className="student-eyebrow">Votre espace Fluentia</p>
    <h1>{profile ? "Mon profil étudiant" : mode === "login" ? "Content de vous retrouver" : "Un premier pas vers vos objectifs"}</h1>
    <p>{profile ? profile.email : "Enregistrez vos réponses et reprenez votre entraînement à votre rythme."}</p>
    {!ready ? <p role="status">Chargement de la session…</p> : <>
      {!profile && <div className="student-nav"><Button variant="secondary" disabled={busy || mode === "login"} onClick={() => {setMode("login"); setError(""); setMessage("");}}>Connexion</Button><Button variant="secondary" disabled={busy || mode === "register"} onClick={() => {setMode("register"); setError(""); setMessage("");}}>Inscription</Button></div>}
      <form onSubmit={submit} className="student-form">
        {(profile || mode === "register") && <label>Prénom ou nom d’usage<input name="display_name" autoComplete="nickname" maxLength={80} required defaultValue={profile?.display_name ?? ""} /></label>}
        {!profile && <>
          <label>Adresse e-mail<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label>Mot de passe<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 12 : undefined} maxLength={128} required /></label>
          {mode === "register" && <p className="student-hint">Au moins 12 caractères. Évitez les mots de passe courants et vos informations personnelles.</p>}
        </>}
        <Button type="submit" loading={busy}>{profile ? "Enregistrer mon profil" : mode === "login" ? "Se connecter" : "Créer mon compte"}</Button>
      </form>
      {profile && <>
        <p>{profile.email_verified ? "Adresse e-mail vérifiée." : "Vérifiez votre adresse e-mail pour commencer un exercice."}</p>
        {!profile.email_verified && <Button variant="secondary" disabled={busy} onClick={resend}>Renvoyer le lien de vérification</Button>}
        {profile.email_verified && <p><Link href="/etudiant">Choisir un exercice</Link></p>}
        <Button variant="ghost" disabled={busy} onClick={signout}>Se déconnecter</Button>
      </>}
    </>}
    <p role="status">{message}</p>{error && <p role="alert">{error}</p>}
  </section>;
}
