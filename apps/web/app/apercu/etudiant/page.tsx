/** Pilote étudiant sans authentification ni données réelles. Propriétaire : Jonathan Kakesa. */
import type { Metadata } from "next";
import { StudentDashboard } from "../../../features/human-centered/student-dashboard";
export const metadata: Metadata = {
  title: "Aperçu du tableau de bord étudiant",
  robots: { index: false, follow: false },
};
export default function StudentPreviewPage() {
  return <StudentDashboard />;
}
