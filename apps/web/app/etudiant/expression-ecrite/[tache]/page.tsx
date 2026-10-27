import { notFound } from "next/navigation";
import { writingTasks } from "../../../../features/student/content";
import { WritingStudio } from "../../../../features/student/writing-studio";
export const dynamicParams = false;
export function generateStaticParams() { return writingTasks.map(task => ({ tache: task.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ tache: string }> }) {
  const { tache } = await params;
  const task = writingTasks.find(t => t.slug === tache);
  return { title: task ? `Expression écrite — tâche ${task.number}` : "Expression écrite" };
}
export default async function Page({ params }: { params: Promise<{ tache: string }> }) {
  const { tache } = await params;
  const task = writingTasks.find(t => t.slug === tache);
  if (!task) notFound();
  return <WritingStudio key={task.slug} task={task} />;
}
