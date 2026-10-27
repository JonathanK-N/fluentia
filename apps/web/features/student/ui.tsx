/** Blocs de présentation partagés par les pages de l’espace étudiant. */
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "../../components/app-shell/icons";
import { skills } from "./content";

export function PageHead({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return <div className="page-head">
    <div>{eyebrow && <p className="student-eyebrow">{eyebrow}</p>}<h2 className="page-title">{title}</h2>{children && <p>{children}</p>}</div>
    {actions && <div className="student-nav">{actions}</div>}
  </div>;
}

/** Indicateur isolé (carte). */
export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon: IconName }) {
  return <div className="stat">
    <span className="stat-head">{label}<Icon name={icon} size={18} /></span>
    <strong>{value}</strong>
    {hint && <small>{hint}</small>}
  </div>;
}

/** Bandeau de bilan : cellules séparées dans un seul cadre. */
export function Summary({ label, items }: { label: string; items: { label: string; value: ReactNode; hint: string; meter?: number }[] }) {
  return <div className="summary" role="group" aria-label={label}>{items.map(item => <div className="summary-cell" key={item.label}>
    <span>{item.label}</span>
    <strong>{item.value}</strong>
    {item.meter !== undefined && <span className="summary-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, item.meter))}%` }} /></span>}
    <small>{item.hint}</small>
  </div>)}</div>;
}

export function Notice({ children, icon = "help" }: { children: ReactNode; icon?: IconName }) {
  return <div className="app-notice"><Icon name={icon} size={18} /><p>{children}</p></div>;
}

export function SectionTitle({ title, link, note }: { title: string; link?: { href: string; label: string }; note?: string }) {
  return <div className="section-title"><h2>{title}</h2>{link ? <Link href={link.href}>{link.label}</Link> : note && <span className="section-note">{note}</span>}</div>;
}

export function SkillChip({ icon, tone }: { icon: IconName; tone: "lavender" | "mint" }) {
  return <span className="skill-chip" data-tone={tone}><Icon name={icon} size={20} /></span>;
}

/** Les quatre épreuves, dans l’ordre du test. */
export function SkillCards() {
  return <div className="skill-grid">{skills.map(skill => <article className="learn-card" key={skill.id}>
    <div className="learn-card-top"><SkillChip icon={skill.icon} tone={skill.tone} /><span className="learn-number">{skill.number}</span></div>
    <div><h3>{skill.name}</h3><p className="learn-sub">{skill.title}</p></div>
    <div className="pill-row">{skill.facts.map(fact => <span className="pill" key={fact}>{fact}</span>)}</div>
    <p className="learn-summary">{skill.summary}</p>
    <Link className="button button-primary tile-link" href={skill.href}>Lancer l’épreuve<span className="sr-only"> — {skill.name}</span><Icon name="arrow" size={15} /></Link>
  </article>)}</div>;
}

export function Bar({ label, value, detail, tone }: { label: string; value: number; detail: string; tone?: "info" }) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <li className="bar-row">
    <span className="bar-row-head"><span>{label}</span><strong>{detail}</strong></span>
    <span className="bar-track" aria-hidden="true"><span className="bar-fill" data-tone={tone} style={{ width: `${safe}%` }} /></span>
  </li>;
}
