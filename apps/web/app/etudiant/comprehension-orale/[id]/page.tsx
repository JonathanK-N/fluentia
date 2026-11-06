import { SeriesIntro } from "../../../../features/student/series-intro";
export const metadata = { title: "Présentation de la série" };
export default async function SeriesIntroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SeriesIntro id={id} />;
}
