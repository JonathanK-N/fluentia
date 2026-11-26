import { SpeakingCorrectionPage } from "../../../../../features/student/writing-correction";
export const metadata = { title: "Correction — expression orale" };
export default async function CorrectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SpeakingCorrectionPage id={id} />;
}
