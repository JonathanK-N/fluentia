"use client";
/** Plan d’étude indicatif, calculé et conservé dans ce navigateur uniquement. */
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/primitives";
import { skills } from "../../../features/student/content";
import { Notice, PageHead, Stat } from "../../../features/student/ui";

type Plan = { goal: string; date: string; hours: number; days: number[]; priority: string };
const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const storageKey = "fluentia-plan";

function schedule(plan: Plan) {
  const order = [plan.priority, ...skills.map(s => s.id).filter(id => id !== plan.priority), plan.priority];
  const minutes = Math.round(plan.hours * 60 / Math.max(1, plan.days.length) / 5) * 5;
  return dayNames.map((name, index) => {
    const slot = plan.days.indexOf(index);
    if (slot < 0) return { name, sessions: [] as string[] };
    const skill = skills.find(s => s.id === order[slot % order.length])!;
    const review = slot === plan.days.length - 1 && plan.days.length > 2;
    return { name, sessions: review ? [`Révision des corrigés · ${minutes} min`] : [`${skill.title} · ${minutes} min`] };
  });
}

export default function PlanPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem(storageKey); if (saved) setPlan(JSON.parse(saved)); else setEditing(true); } catch { setEditing(true); }
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: Plan = { goal: String(form.get("goal")), date: String(form.get("date")), hours: Number(form.get("hours")), days: form.getAll("days").map(Number), priority: String(form.get("priority")) };
    if (!next.days.length) next.days = [0, 2, 4];
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
    setPlan(next); setEditing(false);
  }
  const days = plan?.date ? Math.ceil((Date.parse(plan.date) - Date.now()) / 86_400_000) : null;
  const week = plan ? schedule(plan) : [];
  const priority = skills.find(s => s.id === plan?.priority);
  return <>
    <PageHead eyebrow="Plan d’étude" title="Un rythme qui vous ressemble" actions={plan && !editing ? <Button variant="secondary" onClick={() => setEditing(true)}>Modifier mon plan</Button> : undefined}>
      Indiquez votre objectif et vos disponibilités : Fluentia répartit vos séances sur la semaine. Ce plan reste sur cet appareil.
    </PageHead>
    {editing && <form className="student-card student-form" onSubmit={submit} aria-label="Paramètres du plan">
      <div className="form-row">
        <label>Objectif visé<select name="goal" defaultValue={plan?.goal ?? "NCLC 7"}>{["NCLC 4", "NCLC 5", "NCLC 6", "NCLC 7", "NCLC 8", "NCLC 9", "NCLC 10 et plus"].map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Date prévue du test<input type="date" name="date" defaultValue={plan?.date ?? ""} /></label>
        <label>Temps disponible par semaine<select name="hours" defaultValue={plan?.hours ?? 4}>{[2, 3, 4, 6, 8, 10].map(v => <option key={v} value={v}>{v} heures</option>)}</select></label>
        <label>Compétence prioritaire<select name="priority" defaultValue={plan?.priority ?? "listening"}>{skills.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
      </div>
      <fieldset><legend>Jours où vous pouvez étudier</legend>
        <div className="pill-row">{dayNames.map((name, index) => <label key={name} className="pill" style={{ cursor: "pointer", padding: ".45rem .8rem" }}><input type="checkbox" name="days" value={index} defaultChecked={plan ? plan.days.includes(index) : [0, 2, 4, 5].includes(index)} /> {name}</label>)}</div>
      </fieldset>
      <div className="student-nav" style={{ margin: 0 }}><Button type="submit">Générer mon plan</Button>{plan && <Button variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>}</div>
    </form>}
    {plan && !editing && <>
      <div className="stats">
        <Stat icon="target" label="Objectif" value={plan.goal} hint="Repère indicatif, sans garantie de résultat" />
        <Stat icon="calendar" label="Jours restants" value={days === null ? "—" : days < 0 ? "Passé" : days} hint={plan.date ? new Date(plan.date + "T12:00:00").toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" }) : "Date non renseignée"} />
        <Stat icon="clock" label="Séances par semaine" value={plan.days.length} hint={`${plan.hours} h au total`} />
        <Stat icon="chart" label="Priorité" value={priority?.title.replace("Compréhension", "Compr.").replace("Expression", "Expr.") ?? "—"} hint="Deux séances par semaine" />
      </div>
      <section className="student-card" aria-labelledby="semaine">
        <h2 id="semaine">Votre semaine type</h2>
        <div className="plan-week">{week.map(day => <div key={day.name} className="plan-day" data-rest={!day.sessions.length || undefined}>
          <h3>{day.name}</h3>
          {day.sessions.length ? <ul>{day.sessions.map(s => <li key={s}>{s}</li>)}</ul> : <span className="student-hint">Repos</span>}
        </div>)}</div>
      </section>
      <div className="two-col">
        <section className="student-card" aria-labelledby="jalons">
          <h2 id="jalons">Jalons conseillés</h2>
          <ul className="activity-list">
            <li><span className="activity-title"><strong>Chaque semaine</strong><small>Relire les corrigés et noter trois erreurs récurrentes.</small></span></li>
            <li><span className="activity-title"><strong>Toutes les deux semaines</strong><small>Une simulation complète de compréhension.</small></span><Link href="/etudiant/examens-blancs">Examens blancs</Link></li>
            <li><span className="activity-title"><strong>Deux dernières semaines</strong><small>Une simulation par semaine et des tâches d’expression chronométrées.</small></span></li>
          </ul>
        </section>
        <Notice icon="flag">Ce plan est une suggestion d’organisation. Il ne mesure pas votre niveau et ne remplace pas l’avis d’un enseignant.</Notice>
      </div>
    </>}
  </>;
}
