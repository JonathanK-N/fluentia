import "./student.css";
import { AppShell } from "../../components/app-shell/app-shell";
export const metadata = { title: "Espace étudiant" };
export default function StudentLayout({children}: {children: React.ReactNode}) {
  return <AppShell>{children}</AppShell>;
}
