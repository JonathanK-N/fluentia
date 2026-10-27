/** Page d’épreuve : bandeau, repères, réflexes puis séries ou tâches. */
import Image from "next/image";
import Link from "next/link";
import { Icon } from "../../components/app-shell/icons";
import { Catalogue } from "./catalogue";
import { formatDuration, officialSource, speakingTasks, writingTasks } from "./content";
import { epreuves, type EpreuveId } from "./epreuves";
import { Summary } from "./ui";

function Tasks({ kind }: { kind: "writing" | "speaking" }) {
  const writing = kind === "writing";
  const base = writing ? "/etudiant/expression-ecrite" : "/etudiant/expression-orale";
  const cards = writing
    ? writingTasks.map(t => ({ slug: t.slug, number: t.number, title: t.title, detail: t.genre, facts: [`${t.min}–${t.max} mots`, `${t.minutes} min`] }))
    : speakingTasks.map(t => ({ slug: t.slug, number: t.number, title: t.title, detail: t.goal, facts: [formatDuration(t.seconds), t.prepSeconds ? `${t.prepSeconds / 60} min de préparation` : "Sans préparation"] }));
  return <section aria-labelledby="series" className="series">
    <div className="series-head"><h2 id="series">Vos tâches</h2></div>
    <div className="series-grid series-grid-3">{cards.map(card => <article className="series-card" key={card.slug}>
      <div className="series-card-top"><span className="series-kind" data-mode={card.number === 3 ? "simulation" : "training"}>Tâche {card.number}</span></div>
      <h3>{card.title}</h3>
      <p>{card.detail}</p>
      <div className="pill-row">{card.facts.map(fact => <span className="pill" key={fact}>{fact}</span>)}</div>
      <Link className="button button-primary tile-link" href={`${base}/${card.slug}`}>Ouvrir la tâche<span className="sr-only"> {card.number}</span><Icon name="arrow" size={15} /></Link>
    </article>)}</div>
  </section>;
}

export function EpreuvePage({ id }: { id: EpreuveId }) {
  const e = epreuves[id];
  return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="epreuve-titre">
        <span className="hero-chip-row"><span className="hero-chip">Épreuve {e.number}</span><span>{e.subtitle}</span></span>
        <h1 id="epreuve-titre" className="epreuve-title"><Icon name={e.icon} size={30} />{e.name}</h1>
        <p>{e.lead}</p>
      </section>
      <section className="status-card" aria-labelledby="bon-a-savoir">
        <div className="status-head"><h2 id="bon-a-savoir" className="badge-warn"><Icon name="clock" size={14} />Bon à savoir</h2></div>
        <p className="status-text notice-text">{e.notice} Pour le format de référence, consultez le site de <a href={officialSource} target="_blank" rel="noreferrer">France Éducation international</a>.</p>
        <Image className="status-mark" src="/branding/01_Logos_PNG/fluentia-symbole-transparent-256.png" alt="" width={56} height={56} unoptimized />
      </section>
    </div>
    <div className="section-title"><h2>L’épreuve en bref</h2></div>
    <Summary label="L’épreuve en bref" items={e.brief} />
    <div className="section-title"><h2>3 réflexes à adopter</h2></div>
    <ol className="reflexes">{e.reflexes.map((reflex, index) => <li key={reflex.title} className="reflex">
      <span className="reflex-number" data-tone={index === 1 ? "mint" : "lavender"} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <div><h3>{reflex.title}</h3><p>{reflex.text}</p></div>
    </li>)}</ol>
    {id === "reading" || id === "listening" ? <Catalogue skill={id} /> : <Tasks kind={id} />}
  </>;
}
