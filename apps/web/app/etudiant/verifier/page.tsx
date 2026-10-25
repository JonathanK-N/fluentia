"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/primitives";
import { api } from "../../../lib/student-api";

export default function VerifyPage() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function verify() {
    setBusy(true); setError("");
    try { const data = await api<{detail: string}>("auth/verify/", "POST", {token}); setMessage(data.detail); setToken(""); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="student-card"><h1>Confirmer mon adresse e-mail</h1>
    <p>Le lien est valable 24 heures et ne peut être utilisé qu’une fois.</p>
    {token && <Button loading={busy} onClick={verify}>Vérifier mon adresse</Button>}
    {!token && !message && <p>Ouvrez le lien reçu par e-mail pour continuer.</p>}
    <p role="status">{message}</p>{error && <p role="alert">{error}</p>}
    <Link href="/etudiant/compte">Aller à mon compte</Link>
  </section>;
}
