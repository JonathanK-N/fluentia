"use client";
/** Mot de passe oublié : demande du lien par e-mail, puis choix du nouveau mot de passe depuis ce lien. */
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/primitives";
import { api } from "../../../lib/student-api";

export default function PasswordPage() {
  const [link, setLink] = useState<{ uid: string; token: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Le lien arrive dans le fragment (#) : il n’est jamais envoyé au serveur ni conservé dans l’historique.
    const read = () => {
      const values = new URLSearchParams(window.location.hash.slice(1));
      const uid = values.get("uid"), token = values.get("token");
      if (uid && token) { setLink({ uid, token }); setDone(false); setMessage(""); setError(""); }
      if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
      setReady(true);
    };
    read();
    // Lien ouvert dans un onglet déjà sur cette page : seul le fragment change.
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  async function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setBusy(true); setError(""); setMessage("");
    try { setMessage((await api<{ detail: string }>("auth/password/forgot/", "POST", { email })).detail); setDone(true); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? ""), confirmation = String(form.get("confirmation") ?? "");
    setError(""); setMessage("");
    if (password !== confirmation) { setError("Les deux mots de passe ne sont pas identiques."); return; }
    setBusy(true);
    try { setMessage((await api<{ detail: string }>("auth/password/reset/", "POST", { ...link, password })).detail); setDone(true); setLink(null); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  if (!ready) return null;
  return <section className="student-card auth-panel" style={{ maxWidth: "32rem" }}>
    <h2 className="page-title">{link ? "Choisissez un nouveau mot de passe" : "Mot de passe oublié"}</h2>
    {link && !done && <form onSubmit={reset} className="student-form">
      <p>Le lien reçu par e-mail est valable 60 minutes et ne peut servir qu’une fois.</p>
      <label>Nouveau mot de passe<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
      <label>Confirmer le mot de passe<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
      <p className="student-hint">Au moins 12 caractères. Évitez les mots de passe courants et vos informations personnelles.</p>
      <Button type="submit" loading={busy}>Enregistrer le nouveau mot de passe</Button>
    </form>}
    {!link && !done && <form onSubmit={request} className="student-form">
      <p>Indiquez l’adresse de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
      <label>Adresse e-mail<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <Button type="submit" loading={busy}>Recevoir le lien</Button>
    </form>}
    <p role="status">{message}</p>
    {error && <p role="alert">{error}</p>}
    {error && link && <p><Link href="/etudiant/mot-de-passe" onClick={() => { setLink(null); setError(""); }}>Demander un nouveau lien</Link></p>}
    <p><Link href="/etudiant/compte">Revenir à la connexion</Link></p>
  </section>;
}
