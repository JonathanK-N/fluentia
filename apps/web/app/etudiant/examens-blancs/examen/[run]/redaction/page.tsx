import { MockExamWriting } from "../../../../../../features/student/mock-exam-writing";
export const metadata = { title: "Examen TCF · Rédaction" };
export default async function Page({ params }: { params: Promise<{ run: string }> }) {
  const { run } = await params;
  return <MockExamWriting run={run} />;
}
