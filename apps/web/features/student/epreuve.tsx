/** Page d’épreuve : bandeau, repères, réflexes puis séries ou tâches. */
import Image from "next/image";
import { Icon } from "../../components/app-shell/icons";
import { Catalogue } from "./catalogue";
import { officialSource } from "./content";
import { epreuves, type EpreuveId } from "./epreuves";
import { TaskCards } from "./tasks";
import { Summary } from "./ui";

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
    {id === "reading" || id === "listening" ? <Catalogue skill={id} /> : <TaskCards kind={id} />}
  </>;
}
