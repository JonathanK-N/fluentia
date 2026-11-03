"use client";
/** Consignes d’une série en sept lignes au plus. La séance ne démarre qu’au clic sur « Commencer ». */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../../components/app-shell/icons";
import { Button } from "../../components/ui/primitives";
import { api, type Exam } from "../../lib/student-api";
import { useSession } from "../../lib/session";
import { enterFullscreen, exitFullscreen } from "../../lib/fullscreen";

function pace(exam: Exam) {
  const seconds = Math.floor(exam.duration_seconds / Math.max(1, exam.question_count));
  return seconds >= 120 ? `${Math.round(seconds / 60)} min` : `${seconds} secondes`;
}

function lines(exam: Exam) {
  const listening = exam.skill === "listening";
  const minutes = Math.ceil(exam.duration_seconds / 60);
  return [
    `${exam.question_count} questions · ${minutes} min${exam.total_points > exam.question_count ? ` · ${exam.total_points} points` : ""}.`,
    "Le chrono démarre quand vous cliquez sur « Commencer » et continue même si vous fermez la page.",
    listening ? "Appuyez sur ▶ pour écouter le document, autant de fois que vous voulez, puis choisissez une réponse parmi 4." : "Lisez le document, puis choisissez une réponse parmi 4.",
    "Chaque réponse est enregistrée tout de suite.",
    "La vue d’ensemble, à droite, vous emmène à n’importe quelle question : vous pouvez changer d’avis.",
    `Conseil : ${listening ? "lisez les choix avant d’écouter" : "lisez la question avant le texte"}, et comptez environ ${pace(exam)} par question.`,
    "« Terminer la séance » envoie vos réponses et affiche votre score avec le corrigé.",
  ];
}

export function SeriesIntro({ id }: { id: string }) {
  const { profile, ready } = useSession();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<Exam>(`exams/${id}/`).then(setExam).catch(e => setError((e as Error).message)); }, [id]);

  async function start() {
    if (!exam) return;
    enterFullscreen();
    setBusy(true); setError("");
    try { const attempt = await api<{ id: string }>(`exams/${exam.id}/attempts/`, "POST"); router.push(`/etudiant/${exam.skill === "listening" ? "ecoute" : "lecture"}/${attempt.id}`); }
    catch (e) { exitFullscreen(); setError((e as Error).message); setBusy(false); }
  }

  if (error && !exam) return <div className="empty-block"><h2>Cette série n’est plus disponible</h2><p>{error}</p><Link className="button button-primary tile-link" href="/etudiant#epreuves">Choisir une autre série</Link></div>;
  if (!exam) return <p className="student-hint">Chargement de la série…</p>;
  const back = exam.skill === "listening" ? "/etudiant/comprehension-orale" : "/etudiant/comprehension-ecrite";
  return <section className="student-card series-intro" aria-labelledby="intro-titre">
    <span className="series-kind" data-mode={exam.mode}>{exam.mode === "simulation" ? "Simulation complète" : "Entraînement court"}</span>
    <h2 id="intro-titre">{exam.title}</h2>
    <ol className="series-intro-lines">{lines(exam).map(line => <li key={line}>{line}</li>)}</ol>
    {error && <p role="alert">{error}</p>}
    <div className="series-intro-actions">
      {ready && !profile
        ? <Link className="button button-primary tile-link" href="/etudiant/compte">Se connecter pour commencer<Icon name="arrow" size={15} /></Link>
        : <Button loading={busy} disabled={!ready} onClick={start}>Commencer<Icon name="arrow" size={15} /></Button>}
      <Link className="button button-secondary tile-link" href={back}>Retour aux séries</Link>
    </div>
  </section>;
}
