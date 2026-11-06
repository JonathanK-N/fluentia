import { notFound } from "next/navigation";
import { taskSlugs } from "../../../../features/student/content";
import { TaskStudio } from "../../../../features/student/tasks";
export const dynamicParams = false;
export function generateStaticParams() { return taskSlugs.map(tache => ({ tache })); }
export async function generateMetadata({ params }: { params: Promise<{ tache: string }> }) {
  const { tache } = await params;
  return { title: taskSlugs.includes(tache) ? `Expression orale — tâche ${tache.slice(-1)}` : "Expression orale" };
}
export default async function Page({ params }: { params: Promise<{ tache: string }> }) {
  const { tache } = await params;
  if (!taskSlugs.includes(tache)) notFound();
  return <TaskStudio kind="speaking" slug={tache} />;
}
