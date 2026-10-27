import "../etudiant/student.css";
import { AppShell } from "../../components/app-shell/app-shell";
export const metadata = {title: "Banque pédagogique"};
export default function EditorialLayout({children}: {children: React.ReactNode}) {
  return <AppShell variant="edition">{children}</AppShell>;
}
