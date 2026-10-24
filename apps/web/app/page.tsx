/** Fluentia — vitrine responsive du produit. Auteur : Jonathan Kakesa. */
const modules = [
  {icon:"🎧",title:"Compréhension orale",detail:"Exercices d'écoute et progression structurée."},
  {icon:"📖",title:"Compréhension écrite",detail:"Textes, questions et stratégies de compréhension."},
  {icon:"✍️",title:"Expression écrite",detail:"Méthode de rédaction et maîtrise des trois tâches."},
  {icon:"🎙️",title:"Expression orale",detail:"Préparation guidée et entraînement à l'entretien."},
];
export default function Home(){return <main>
  <header className="nav"><a className="brand" href="/">◉ <span>Fluentia</span></a><nav><a href="#modules">Programme</a><a href="#vision">Vision</a><a className="outline" href="mailto:contact@cognito-inc.ca?subject=Fluentia">Contact ↗</a></nav></header>
  <section className="hero"><div className="hero-inner"><p className="eyebrow">✦ LE FUTUR DE VOTRE PRÉPARATION AU TCF CANADA</p><h1>Votre français.<br/><em>Votre avenir.</em></h1><p className="lead">Une nouvelle expérience de préparation, pensée pour vous aider à développer vos compétences et avancer vers votre objectif.</p><div className="actions"><a className="primary" href="#modules">Explorer la plateforme ↗</a><a className="outline" href="#vision">Notre approche ↓</a></div><small>Plateforme en cours de développement</small></div><div className="orb" aria-hidden="true"><span>F</span></div></section>
  <section id="modules" className="modules"><p className="eyebrow">QUATRE COMPÉTENCES</p><h2>La préparation complète.<br/><em>Un seul espace.</em></h2><div className="cards">{modules.map((m,i)=><article className="card" key={m.title}><div className="card-top"><span>0{i+1}</span><span>{m.icon}</span></div><h3>{m.title}</h3><p>{m.detail}</p></article>)}</div></section>
  <section id="vision" className="vision"><p className="eyebrow">LA VISION FLUENTIA</p><h2>Une méthode claire.<br/><em>Une progression durable.</em></h2><p>Contenus pédagogiques, parcours individualisés et entraînements réguliers : chaque étape compte.</p></section>
  <footer><span>© {new Date().getFullYear()} Fluentia — Jonathan Kakesa</span><span>Identité visuelle inspirée de Cognito Inc.</span></footer>
</main>}
