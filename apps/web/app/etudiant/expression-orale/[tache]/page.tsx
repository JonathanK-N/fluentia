import { notFound } from "next/navigation";
import { speakingTasks } from "../../../../features/student/content";
import { SpeakingStudio } from "../../../../features/student/speaking-studio";
export const dynamicParams = false;
export function generateStaticParams() { return speakingTasks.map(task => ({ tache: task.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ tache: string }> }) {
  const { tache } = await params;
  const task = speakingTasks.find(t => t.slug === tache);
  return { title: task ? `Expression orale — tâche ${task.number}` : "Expression orale" };
}
export default async function Page({ params }: { params: Promise<{ tache: string }> }) {
  const { tache } = await params;
  const task = speakingTasks.find(t => t.slug === tache);
  if (!task) notFound();
  return <SpeakingStudio key={task.slug} task={task} />;
}
