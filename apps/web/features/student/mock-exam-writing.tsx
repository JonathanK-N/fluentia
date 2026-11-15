"use client";
/** Rédaction de l’Examen TCF : les trois tâches, un seul chrono de 60 minutes, envoi automatique à la fin du temps. */
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/primitives";
import { Icon } from "../../components/app-shell/icons";
import { api, type MockWriting } from "../../lib/student-api";
import { enterFullscreen, exitFullscreen } from "../../lib/fullscreen";
import { countWords } from "./content";
import { SeanceBar, SeanceHead, Timer } from "./seance";
import { MOCK_BASE } from "./mock-exam";

const draftKey = (run: string, number: number) => `fluentia:examen:${run}:redaction:${number}`;
function readDraft(key: string) { try { return localStorage.getItem(key) ?? ""; } catch { return ""; } }
function writeDraft(key: string, text: string) { try { if (text) localStorage.setItem(key, text); else localStorage.removeItem(key); } catch { /* stockage indisponible */ } }

export function MockExamWriting({ run }: { run: string }) {
  const router = useRouter();
  const [data, setData] = useState<MockWriting | null>(null);
  const [error, setError] = useState("");
  const [texts, setTexts] = useState(["", "", ""]);
  const [current, setCurrent] = useState(0);
  const [left, setLeft] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const offset = useRef(0);
  const sent = useRef(false);

  const back = useCallback(() => { exitFullscreen(); router.replace(`${MOCK_BASE}/${run}`); }, [router, run]);
  useEffect(() => {
    api<MockWriting>(`mock-exam-runs/${run}/writing/`).then(value => {
      if (value.submitted) return back();
      offset.current = Date.parse(value.server_now) - Date.now();
      setTexts(value.tasks.map(task => readDraft(draftKey(run, task.number))));
      setData(value);
    }).catch(e => setError((e as Error).message));
  }, [run, back]);
  // Plein écran sans le menu du site, comme les autres séances.
  useEffect(() => {
    document.documentElement.dataset.examFocus = "";
    return () => { delete document.documentElement.dataset.examFocus; };
  }, []);
  useEffect(() => { if (!data) return; data.tasks.forEach((task, index) => writeDraft(draftKey(run, task.number), texts[index] ?? "")); }, [data, run, texts]);

  const submit = useCallback(async () => {
    if (!data || sent.current) return;
    sent.current = true; setSending(true); setError(""); setConfirming(false);
    try {
      await api(`mock-exam-runs/${run}/writing/`, "POST", { texts });
      data.tasks.forEach(task => writeDraft(draftKey(run, task.number), ""));
      back();
    } catch (e) { sent.current = false; setSending(false); setError((e as Error).message); }
  }, [back, data, run, texts]);

  // Le chrono suit l’heure du serveur : il continue même si la page est fermée, et le texte part à 0.
  useEffect(() => {
    if (!data?.deadline) return;
    const deadline = Date.parse(data.deadline);
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now() - offset.current) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [data]);
  useEffect(() => { if (left === 0) submit(); }, [left, submit]);

  async function startNow() {
    enterFullscreen();
    try { setData(await api<MockWriting>(`mock-exam-runs/${run}/writing/`, "POST")); }
    catch (e) { setError((e as Error).message); }
  }

  if (error && !data) return <div className="empty-block"><h2>Rédaction indisponible</h2><p>{error}</p><Link className="button button-primary tile-link" href={`${MOCK_BASE}/${run}`}>Revenir à l’examen</Link></div>;
  if (!data) return <p className="student-hint">Chargement de la Rédaction…</p>;
  const task = data.tasks[current]!;
  const text = texts[current] ?? "";
  const words = countWords(text);
  const total = data.minutes * 60;
  const counts = texts.map(countWords);

  return <div className="seance">
    <SeanceBar label={`${data.title} · Rédaction`}>
      <Dialog.Root open={confirming} onOpenChange={setConfirming}>
        <Dialog.Trigger className="seance-quit"><Icon name="check" size={14} />Terminer la Rédaction</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content quit-dialog">
            <Dialog.Title>Terminer la Rédaction ?</Dialog.Title>
            <Dialog.Description>
              Vos trois textes sont envoyés tels quels ({counts.map((count, index) => `tâche ${index + 1} : ${count} mot${count > 1 ? "s" : ""}`).join(", ")}).
              Une tâche de moins de 20 mots compte pour zéro. Vous passez ensuite à l’Oral ; la correction arrive avec votre bilan.
            </Dialog.Description>
            <div className="quit-actions">
              <Button loading={sending} onClick={submit}>Envoyer mes trois textes</Button>
              <Dialog.Close asChild><Button variant="secondary" disabled={sending}>Continuer à écrire</Button></Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </SeanceBar>
    <div className="seance-body oral-body writing-body">
      <SeanceHead chips={[{ label: "Épreuve 03" }, { label: "Examen TCF · non officiel", tone: "warn" }]} title={task.title} subtitle={`Tâche ${task.number} · ${task.name} · entre ${task.min} et ${task.max} mots`} current={task.number} />
      <nav className="oral-tasks mock-writing-tabs" aria-label="Tâches de la Rédaction">
        {data.tasks.map((item, index) => <button key={item.number} type="button" aria-current={index === current ? "page" : undefined} onClick={() => setCurrent(index)}>
          Tâche {item.number}<small>{counts[index]} mot{(counts[index] ?? 0) > 1 ? "s" : ""}</small>
        </button>)}
      </nav>

      <section className="oral-card oral-card-wide" aria-labelledby="seance-title">
        {data.started_at
          ? <>
            <div className="oral-visual">
              <div className="oral-orb-wrap">
                <Timer left={left ?? total} progress={(left ?? total) / total} label={left === 0 ? "Terminé" : "Il reste"} total={total} />
                <p className="oral-pill" aria-live="polite"><span aria-hidden="true" />Un seul chrono pour les 3 tâches</p>
              </div>
            </div>
            <div className="oral-message">
              <span className="oral-message-icon" aria-hidden="true"><Icon name="pen" size={16} /></span>
              <div>
                <small>Consigne · tâche {task.number}</small>
                <p className="writing-prompt">{task.prompt}</p>
                {task.documents?.length > 0 && <div className="writing-documents">{task.documents.map(doc => <article key={doc.label}><h3>{doc.label}</h3><p>{doc.text}</p></article>)}</div>}
              </div>
            </div>
            <div className="writing-field">
              <label htmlFor="redaction" className="sr-only">Votre texte pour la tâche {task.number}</label>
              <textarea id="redaction" className="writing-area" value={text} disabled={left === 0 || sending} spellCheck={false} aria-describedby="compteur"
                onChange={e => { const value = e.target.value; setTexts(all => all.map((item, index) => index === current ? value : item)); }}
                placeholder="Rédigez votre texte ici…" />
              <p className="student-hint" id="compteur" aria-live="polite">{words} mot{words > 1 ? "s" : ""} · cible {task.min}–{task.max} · brouillon gardé sur cet appareil</p>
            </div>
            {error && <p role="alert" className="examiner-error">{error}</p>}
            <div className="oral-actions">
              {current > 0 && <Button variant="secondary" onClick={() => setCurrent(current - 1)}><Icon name="back" size={15} />Tâche {current}</Button>}
              {current < data.tasks.length - 1
                ? <Button onClick={() => setCurrent(current + 1)}>Tâche {current + 2}<Icon name="arrow" size={15} /></Button>
                : <Button onClick={() => setConfirming(true)}>Terminer la Rédaction<Icon name="check" size={15} /></Button>}
            </div>
          </>
          : <div className="mock-writing-start">
            <p>Les trois tâches s’écrivent en {data.minutes} minutes au total. Le chrono démarre maintenant et continue même si vous fermez la page.</p>
            <Button onClick={startNow}>Commencer la Rédaction<Icon name="arrow" size={15} /></Button>
          </div>}
      </section>
    </div>
  </div>;
}
