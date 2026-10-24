/** Accueil Discover. Propriétaire : Jonathan Kakesa. Démonstrations sans backend. */
import { Hero } from "../features/landing/hero";
import {
  Competencies,
  Coach,
  Journey,
  DashboardPreview,
} from "../features/landing/sections";
import { VoiceDemo } from "../features/landing/voice-demo";
import {
  Pricing,
  Faq,
  FinalCallToAction,
} from "../features/landing/pricing-faq";
export default function Home() {
  return (
    <main id="contenu" tabIndex={-1} className="landing discover">
      <Hero />
      <Competencies />
      <Coach />
      <VoiceDemo />
      <Journey />
      <DashboardPreview />
      <Pricing />
      <Faq />
      <FinalCallToAction />
    </main>
  );
}
