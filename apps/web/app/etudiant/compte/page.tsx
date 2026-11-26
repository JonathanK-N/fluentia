"use client";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { Button } from "../../../components/ui/primitives";
import { Icon } from "../../../components/app-shell/icons";
import { api, type Profile } from "../../../lib/student-api";
import { initials, useSession } from "../../../lib/session";
import { SectionTitle, Summary } from "../../../features/student/ui";
import { FORGOT_EMAIL, PasswordInput } from "../../../features/student/password-input";

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
    <div id="abonnement" className="anchor-target"><SectionTitle title="Mon abonnement" /></div>
    <Summary label="Mon abonnement" items={[
      { label: "Temps restant", value: sub.status === "premium" ? days : "—", hint: sub.status === "premium" ? "Avant la fin du Premium" : "Aucun Premium en cours" },
      { label: "Valable jusqu’au", value: sub.premium_until ? longDate(sub.premium_until) : "—", hint: sub.status === "premium" ? sub.plan_label ?? "Premium actif" : sub.status === "expired" ? "Premium terminé" : "Formule gratuite" },
      { label: "Essais d’oral", value: sub.speaking_attempts_left !== null ? `${sub.speaking_attempts_left} sur ${sub.speaking_attempts}` : "—", hint: sub.status === "premium" ? "Une tâche = un essai, jusqu’à la fin de la formule" : "Une tâche 1 offerte sans Premium" },
      { label: "Identifiant", value: <span className="summary-email">{profile.email}</span>, hint: "Adresse de connexion" },
    ]} />
    <PremiumOffers renewing={sub.status !== "free"} active={sub.status === "premium"} setMessage={setMessage} />
    <section className="student-card settings-card" aria-labelledby="reglages">
      <div className="card-title"><span className="skill-chip"><Icon name="sliders" size={18} /></span><h2 id="reglages">Réglages d’entraînement</h2></div>
      <p>Pendant les QCM, la correction en direct indique tout de suite si votre réponse est juste. Désactivez-la pour vous mettre en conditions d’examen : rien n’est révélé avant la fin.</p>
      <div className="settings">
        <Switch id="reglage-correction" label="Correction en direct" hint="Juste ou faux après chaque réponse" checked={profile.preferences.live_correction} disabled={busy} onChange={value => prefer("live_correction", value)} />
        <Switch id="reglage-son" label="Signal sonore" hint="Un son pour chaque bonne ou mauvaise réponse" icon="volume" checked={profile.preferences.answer_sound} disabled={busy || !profile.preferences.live_correction} onChange={value => prefer("answer_sound", value)} />
      </div>
    </section>
    <DeleteAccount onDeleted={() => act(async () => null, "Votre compte et toutes vos données ont été supprimés.")} />
  </>;
}

type Offer = { plan: string; name: string; amount: number; currency: string; days: number; speaking_attempts: number };
const dollars = (cents: number) => `${(cents / 100).toLocaleString("fr-CA", { minimumFractionDigits: 2 })} $ US`;

/** Tout ce que chaque formule donne, en plus de sa durée et de ses tâches d’oral. */
const PREMIUM_ACCESS = [
  "Les 3 tâches de l’oral, chronométrées comme le jour de l’examen",
  "Correction de l’oral avec la transcription de vos réponses",
  "Examens TCF complets : les 4 épreuves enchaînées, avec bilan",
  "Compréhension orale et écrite : toutes les séries, avec corrigés",
  "Expression écrite corrigée par l’IA (jusqu’à 10 par jour)",
  "Score sur 699 et niveau NCLC estimés à chaque épreuve",
  "Suivi de progression et historique de vos corrections",
  "Un seul paiement, sans renouvellement automatique",
];

/** Formules Premium payées par carte sur la page sécurisée de Stripe ; Fluentia ne voit jamais le numéro de carte. */
function PremiumOffers({ renewing, active, setMessage }: { renewing: boolean; active: boolean; setMessage: (value: string) => void }) {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [available, setAvailable] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [chosen, setChosen] = useState("1_mois");
  useEffect(() => {
    api<{ offers: Offer[]; available: boolean }>("auth/billing/offers/").then(data => { setOffers(data.offers); setAvailable(data.available); }).catch(() => setOffers([]));
  }, []);
  async function pay(plan: string) {
    setPaying(plan); setMessage("");
    try { const { url } = await api<{ url: string }>("auth/billing/checkout/", "POST", { plan }); window.location.assign(url); }
    catch (e) { setMessage((e as Error).message); setPaying(null); }
  }
  if (!offers?.length) return null;
  return <section className="premium-offers" aria-labelledby="formules">
    <h3 id="formules">{renewing ? "Renouveler mon Premium" : "Passer au Premium"}</h3>
    <p className="student-hint">Paiement unique par carte de crédit, en dollars américains, sur la page sécurisée de Stripe. Rien ne se renouvelle automatiquement.{active ? " Une nouvelle formule s’ajoute à la fin de votre Premium en cours." : ""}</p>
    <div className="premium-grid">{offers.map(offer => <article key={offer.plan} className="premium-offer" data-featured={offer.plan === chosen || undefined}
      onClick={() => setChosen(offer.plan)} onFocusCapture={() => setChosen(offer.plan)}>
      {offer.plan === "1_mois" && <span className="plan-badge">Le plus choisi</span>}
      <h4>{offer.name}</h4>
      <p className="premium-price">{dollars(offer.amount)}</p>
      <ul>
        <li><Icon name="check" size={14} /><strong>{offer.days} jours d’accès Premium</strong></li>
        <li><Icon name="check" size={14} /><strong>{offer.speaking_attempts} tâches d’oral avec l’examinateur IA</strong></li>
        {PREMIUM_ACCESS.map(item => <li key={item}><Icon name="check" size={14} />{item}</li>)}
      </ul>
      <Button variant={offer.plan === chosen ? "primary" : "secondary"} loading={paying === offer.plan} disabled={!available || paying !== null} onClick={() => pay(offer.plan)}>
        Payer {dollars(offer.amount)}<span className="sr-only"> pour {offer.name}</span>
      </Button>
    </article>)}</div>
    {!available && <p className="student-hint">Le paiement en ligne ouvre très bientôt.</p>}
  </section>;
}

/** Droit à l’effacement : le compte et toutes ses données partent, après confirmation par le mot de passe. */
function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function confirm(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try { await api("auth/account/delete/", "POST", { password }); setOpen(false); onDeleted(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="student-card danger-card" aria-labelledby="suppression">
    <div className="card-title"><span className="skill-chip"><Icon name="trash" size={18} /></span><h2 id="suppression">Supprimer mon compte</h2></div>
    <p>Votre compte et toutes vos données sont effacés définitivement : séances, réponses, textes, échanges d’oral, corrections, programme et abonnement.</p>
    <Dialog.Root open={open} onOpenChange={value => { setOpen(value); setPassword(""); setError(""); }}>
      <Dialog.Trigger asChild><Button variant="secondary" className="danger-button"><Icon name="trash" size={15} />Supprimer mon compte</Button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content quit-dialog">
          <Dialog.Title>Supprimer définitivement votre compte ?</Dialog.Title>
          <Dialog.Description>Cette action est irréversible. Entrez votre mot de passe pour confirmer.</Dialog.Description>
          <form className="student-form" onSubmit={confirm}>
            <label htmlFor="suppression-mdp">Mot de passe</label>
            <PasswordInput id="suppression-mdp" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
            {error && <p role="alert">{error}</p>}
            <div className="quit-actions">
              <Button type="submit" className="danger-button" loading={busy} disabled={!password}>Supprimer définitivement</Button>
              <Dialog.Close asChild><Button variant="secondary" disabled={busy}>Garder mon compte</Button></Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </section>;
}

export default function AccountPage() {
  const { profile, ready, setProfile, refresh } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Les liens « Créer mon compte » de l’accueil pointent vers #inscription.
  useEffect(() => { if (window.location.hash === "#inscription") setMode("register"); }, []);
  // Retour de Stripe (?paiement=<séance> ou ?paiement=annule) : on confirme le paiement, puis on nettoie l’adresse.
  useEffect(() => {
    const session = new URLSearchParams(window.location.search).get("paiement");
    if (!session) return;
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.hash}`);
    if (session === "annule") { setMessage("Paiement annulé : aucun montant n’a été débité."); return; }
    setMessage("Confirmation de votre paiement…");
    (async () => {
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const data = await api<{ status: string }>(`auth/billing/checkout/${encodeURIComponent(session)}/`);
          if (data.status === "paid") { await refresh(); setMessage("Paiement reçu, merci ! Votre Premium est activé."); return; }
        } catch { /* nouvel essai dans un instant */ }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setMessage("Votre paiement est en cours de confirmation. Rechargez la page dans quelques minutes ; écrivez-nous si le Premium n’apparaît pas.");
    })();
  }, [refresh]);
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
    const { confirmation, ...values } = Object.fromEntries(new FormData(event.currentTarget));
    if (mode === "register" && values.password !== confirmation) {
      setMessage(""); setError("Les deux mots de passe ne sont pas identiques. Retapez-les.");
      return;
    }
    if (mode === "login") act(() => api<Profile>("auth/login/", "POST", values));
    else act(async () => { const data = await api<{ detail: string }>("auth/register/", "POST", values); setMessage(data.detail + " Consultez votre boîte e-mail, puis connectez-vous."); return null; });
  }
  // L’adresse déjà tapée suit vers « Mot de passe oublié » (jamais dans l’adresse de la page).
  function rememberEmail(event: MouseEvent<HTMLAnchorElement>) {
    const email = event.currentTarget.closest("form")?.querySelector<HTMLInputElement>("input[name=email]")?.value.trim();
    try { if (email) sessionStorage.setItem(FORGOT_EMAIL, email); } catch { /* stockage indisponible : on retape l’adresse */ }
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
        <label>
          <span className="password-label">Mot de passe
            {mode === "login" && <Link href="/etudiant/mot-de-passe" onClick={rememberEmail}>Mot de passe oublié ?</Link>}
          </span>
          <PasswordInput key={mode} name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 12 : undefined} maxLength={128} required />
        </label>
        {mode === "register" && <label>Confirmer le mot de passe<PasswordInput name="confirmation" autoComplete="new-password" minLength={12} maxLength={128} required /></label>}
        {mode === "register" && <p className="student-hint">Au moins 12 caractères. Évitez les mots de passe courants et vos informations personnelles.</p>}
        {mode === "register" && <p className="student-hint">En créant un compte, vous acceptez les <Link href="/conditions">conditions d’utilisation</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>.</p>}
        <Button type="submit" loading={busy}>{mode === "login" ? "Se connecter" : "Créer mon compte"}</Button>
      </form>
      {status}
    </section>
  </div>;
}
