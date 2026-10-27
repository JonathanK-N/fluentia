/** Blocs de présentation partagés par les pages de l’espace étudiant. */
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "../../components/app-shell/icons";
import { skills } from "./content";

export function PageHead({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return <div className="page-head">
    <div>{eyebrow && <p className="student-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{children && <p>{children}</p>}</div>
    {actions && <div className="student-nav">{actions}</div>}
  </div>;
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon: IconName }) {
  return <div className="stat">
    <span className="stat-head">{label}<Icon name={icon} size={18} /></span>
    <strong>{value}</strong>
    {hint && <small>{hint}</small>}
  </div>;
}

export function Notice({ children, icon = "help" }: { children: ReactNode; icon?: IconName }) {
  return <div className="app-notice"><Icon name={icon} size={18} /><p>{children}</p></div>;
}

export function SectionTitle({ title, link }: { title: string; link?: { href: string; label: string } }) {
  return <div className="section-title"><h2>{title}</h2>{link && <Link href={link.href}>{link.label}</Link>}</div>;
}

export function SkillCards({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return <div className="skill-grid">{skills.map(skill => <article className="learn-card" key={skill.id}>
    <span className="skill-icon"><Icon name={skill.icon} size={22} /></span>
    <Heading>{skill.title}</Heading>
    <span className="skill-meta">{skill.format}</span>
    <p>{skill.summary}</p>
    <Link className="button button-secondary tile-link" href={skill.href}>Commencer<span className="sr-only"> — {skill.title}</span><Icon name="arrow" size={16} /></Link>
  </article>)}</div>;
}

export function Bar({ label, value, detail, tone }: { label: string; value: number; detail: string; tone?: "info" }) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <li className="bar-row">
    <span className="bar-row-head"><span>{label}</span><strong>{detail}</strong></span>
    <span className="bar-track" aria-hidden="true"><span className="bar-fill" data-tone={tone} style={{ width: `${safe}%` }} /></span>
  </li>;
}
