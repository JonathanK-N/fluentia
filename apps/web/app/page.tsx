/** Accueil public de Fluentia. Propriétaire : Jonathan Kakesa. */
import { Hero } from "../features/landing/hero";
import { Exams, Examiner, Steps } from "../features/landing/sections";
import { Pricing, Faq, FinalCallToAction } from "../features/landing/pricing-faq";
import "../features/landing/home.css";

export default function Home() {
  return (
    <main id="contenu" tabIndex={-1} className="home human-pilot">
      <Hero />
      <Exams />
      <Examiner />
      <Steps />
      <Pricing />
      <Faq />
      <FinalCallToAction />
    </main>
  );
}
