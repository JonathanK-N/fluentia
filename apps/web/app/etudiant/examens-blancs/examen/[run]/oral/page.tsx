import { MockExamSpeaking } from "../../../../../../features/student/mock-exam-speaking";
export const metadata = { title: "Examen TCF · Oral" };
export default async function Page({ params }: { params: Promise<{ run: string }> }) {
  const { run } = await params;
  return <MockExamSpeaking run={run} />;
}
