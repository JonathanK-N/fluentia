"use client";
/** Plan d’étude indicatif, calculé et conservé dans ce navigateur uniquement. */
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/primitives";
import { skills } from "../../../features/student/content";
import { Icon } from "../../../components/app-shell/icons";
import { PageHero, SectionTitle, Summary } from "../../../features/student/ui";

type Plan = { goal: string; date: string; hours: number; days: number[]; priority: string };
const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const storageKey = "fluentia-plan";
const milestones = [
  { title: "Chaque semaine", text: "Relire les corrigés et noter trois erreurs récurrentes." },
  { title: "Toutes les deux semaines", text: "Une simulation complète de compréhension.", link: { href: "/etudiant/examens-blancs", label: "Simulations TCF" } },
  { title: "Deux dernières semaines", text: "Une simulation par semaine et des tâches d’expression chronométrées." },
];

function schedule(plan: Plan) {
  const order = [plan.priority, ...skills.map(s => s.id).filter(id => id !== plan.priority), plan.priority];
  const minutes = Math.round(plan.hours * 60 / Math.max(1, plan.days.length) / 5) * 5;
  return dayNames.map((name, index) => {
    const slot = plan.days.indexOf(index);
    if (slot < 0) return { name, sessions: [] as string[] };
    const skill = skills.find(s => s.id === order[slot % order.length])!;
    const review = slot === plan.days.length - 1 && plan.days.length > 2;
    return { name, sessions: review ? [`Révision des corrigés · ${minutes} min`] : [`${skill.name} · ${minutes} min`] };
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
    <PageHero chip="Mon programme" title="Un rythme qui vous ressemble"
      actions={plan && !editing ? <button type="button" className="hero-button" onClick={() => setEditing(true)}>Modifier mon programme<Icon name="arrow" size={16} /></button> : undefined}
      aside="Ce plan est une suggestion d’organisation : il reste sur cet appareil, ne mesure pas votre niveau et ne remplace pas l’avis d’un enseignant.">
      Indiquez votre objectif et vos disponibilités : Fluentia répartit vos séances sur la semaine.
    </PageHero>
    {editing && <>
      <SectionTitle title="Vos paramètres" />
      <form className="student-card student-form" onSubmit={submit} aria-label="Paramètres du programme" style={{ marginTop: 0 }}>
        <div className="form-row">
          <label>Objectif visé<select name="goal" defaultValue={plan?.goal ?? "NCLC 7"}>{["NCLC 4", "NCLC 5", "NCLC 6", "NCLC 7", "NCLC 8", "NCLC 9", "NCLC 10 et plus"].map(v => <option key={v}>{v}</option>)}</select></label>
          <label>Date prévue du test<input type="date" name="date" defaultValue={plan?.date ?? ""} /></label>
          <label>Temps disponible par semaine<select name="hours" defaultValue={plan?.hours ?? 4}>{[2, 3, 4, 6, 8, 10].map(v => <option key={v} value={v}>{v} heures</option>)}</select></label>
          <label>Compétence prioritaire<select name="priority" defaultValue={plan?.priority ?? "listening"}>{skills.map(s => <option key={s.id} value={s.id}>{s.name} — {s.title}</option>)}</select></label>
        </div>
        <fieldset><legend>Jours où vous pouvez étudier</legend>
          <div className="pill-row">{dayNames.map((name, index) => <label key={name} className="pill" style={{ cursor: "pointer", padding: ".45rem .8rem" }}><input type="checkbox" name="days" value={index} defaultChecked={plan ? plan.days.includes(index) : [0, 2, 4, 5].includes(index)} /> {name}</label>)}</div>
        </fieldset>
        <div className="student-nav" style={{ margin: 0 }}><Button type="submit">Générer mon programme</Button>{plan && <Button variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>}</div>
      </form>
    </>}
    {plan && !editing && <>
      <SectionTitle title="Votre programme" />
      <Summary label="Votre programme" items={[
        { label: "Objectif", value: plan.goal, hint: "Repère indicatif, sans garantie de résultat" },
        { label: "Jours restants", value: days === null ? "—" : days < 0 ? "Passé" : days, hint: plan.date ? new Date(plan.date + "T12:00:00").toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" }) : "Date non renseignée" },
        { label: "Séances par semaine", value: plan.days.length, hint: `${plan.hours} h au total` },
        { label: "Priorité", value: priority?.name ?? "—", hint: "Deux séances par semaine" },
      ]} />
      <SectionTitle title="Votre semaine type" />
      <div className="plan-week">{week.map(day => <div key={day.name} className="plan-day" data-rest={!day.sessions.length || undefined}>
        <h3>{day.name}</h3>
        {day.sessions.length ? <ul>{day.sessions.map(s => <li key={s}>{s}</li>)}</ul> : <span className="student-hint">Repos</span>}
      </div>)}</div>
      <SectionTitle title="Jalons conseillés" />
      <ol className="reflexes">{milestones.map((m, index) => <li key={m.title} className="reflex">
        <span className="reflex-number" data-tone={index === 1 ? "mint" : "lavender"} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div><h3>{m.title}</h3><p>{m.text}{m.link && <> <Link href={m.link.href}>{m.link.label}</Link></>}</p></div>
      </li>)}</ol>
    </>}
  </>;
}
