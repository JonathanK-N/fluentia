/** Page de compétence de compréhension : format, méthode et exercices publiés. */
import { Catalogue } from "./catalogue";
import { officialSource } from "./content";
import { Notice, PageHead, SectionTitle, Stat } from "./ui";

const details = {
  reading: { title: "Compréhension écrite", lead: "Des documents du quotidien aux textes argumentatifs : apprenez à repérer l’information utile, puis vérifiez chaque choix grâce au corrigé expliqué.", questions: "39", duration: "60 min", tips: ["Lisez d’abord la question, puis cherchez la réponse dans le document.", "Repérez les mots qui changent le sens : négations, restrictions, dates.", "Ne bloquez pas : une question omise compte zéro, comme une erreur."] },
  listening: { title: "Compréhension orale", lead: "Annonces, conversations et extraits radio : entraînez votre oreille avec réécoute et transcription, puis passez en simulation avec une diffusion unique.", questions: "39", duration: "35 min", tips: ["En entraînement, réécoutez librement et comparez avec la transcription.", "En simulation, chaque document n’est diffusé qu’une fois : restez concentré.", "Anticipez en lisant les choix dès qu’ils apparaissent."] },
} as const;

export function ComprehensionPage({ skill }: { skill: "reading" | "listening" }) {
  const d = details[skill];
  return <>
    <PageHead eyebrow={skill === "reading" ? "Lecture" : "Écoute"} title={d.title}>{d.lead}</PageHead>
    <div className="stats">
      <Stat icon="exam" label="Format du test" value={`${d.questions} questions`} hint="Quatre choix, une seule réponse" />
      <Stat icon="clock" label="Durée de l’épreuve" value={d.duration} hint="Format indicatif" />
      <Stat icon="target" label="Difficulté" value="Progressive" hint="Proposée par les auteurs, non calibrée" />
    </div>
    <div className="two-col">
      <section className="student-card" aria-labelledby="methode"><h2 id="methode">Méthode recommandée</h2><ul className="checklist">{d.tips.map(tip => <li key={tip}>{tip}</li>)}</ul></section>
      <Notice icon="flag">Entraînements et simulations non officiels. Consultez le <a href={officialSource} target="_blank" rel="noreferrer">site de France Éducation international</a> pour le format de référence.</Notice>
    </div>
    <SectionTitle title="Séries disponibles" />
    <Catalogue skill={skill} />
  </>;
}
