import { MockExamRunPage } from "../../../../../features/student/mock-exam";
export const metadata = { title: "Examen TCF" };
export default async function Page({ params }: { params: Promise<{ run: string }> }) {
  const { run } = await params;
  return <MockExamRunPage id={run} />;
}
