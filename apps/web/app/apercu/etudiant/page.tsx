/** Pilote étudiant sans authentification ni données réelles. Propriétaire : Jonathan Kakesa. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
// V1 : masquée en production avec FLUENTIA_HIDE_DEMO_PAGES=1 ; reste visible pour le développement et les tests.
import { StudentDashboard } from "../../../features/human-centered/student-dashboard";
export const metadata: Metadata = {
  title: "Aperçu du tableau de bord étudiant",
  robots: { index: false, follow: false },
};
export default function StudentPreviewPage() {
  if (process.env.FLUENTIA_HIDE_DEMO_PAGES === "1") notFound();
  return <StudentDashboard />;
}
