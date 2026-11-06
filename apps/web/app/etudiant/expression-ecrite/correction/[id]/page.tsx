import { WritingCorrectionPage } from "../../../../../features/student/writing-correction";
export const metadata = { title: "Correction — expression écrite" };
export default async function CorrectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WritingCorrectionPage id={id} />;
}
