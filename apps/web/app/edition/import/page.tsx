"use client";
/** Import d’une série depuis un modèle Excel, puis relecture et publication, dans le style de l’espace étudiant. */
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/primitives";
import { Icon, type IconName } from "../../../components/app-shell/icons";
import { api, postForm } from "../../../lib/student-api";

type Skill = "reading" | "listening" | "writing" | "speaking";
type Status = "draft" | "review" | "approved" | "published";
type ImportError = { ligne: number | null; colonne: string | null; message: string };
type Series = { id: string; skill: Skill; title: string; mode: string; file_name: string; created_at: string; status: Status; size: number; exam: { version: number; is_published: boolean } | null; active: boolean };
type Question = { id: string; position: number; level: string; points: number; statement: string; passage: string; image: string | null; image_text: string; transcript: string; choices: string[]; correct_index: number; explanation: string };
type Task = { slug: string; number: number; title: string; genre?: string; min?: number; max?: number; minutes?: number; seconds?: number; prepSeconds?: number; subjects: { title: string; prompt: string; documents?: { label: string; text: string }[]; cues?: string[] }[] };
type Detail = Series & { questions?: Question[]; tasks?: Task[] };

const SKILLS: { id: Skill; number: string; name: string; title: string; icon: IconName; tone: "lavender" | "mint"; content: string; files: string; href: string }[] = [
  { id: "reading", number: "01", name: "Lecture", title: "Compréhension écrite", icon: "book", tone: "lavender", content: "Une ligne par question : texte ou image, question, choix A à D, bonne réponse, indice.", files: "Tableur seul, ou .zip avec les images", href: "/etudiant/comprehension-ecrite" },
  { id: "listening", number: "02", name: "Écoute", title: "Compréhension orale", icon: "headphones", tone: "mint", content: "Une ligne par question : audio WAV, transcription, question, choix A à D, bonne réponse, indice.", files: ".zip avec les audios (et images)", href: "/etudiant/comprehension-orale" },
  { id: "writing", number: "03", name: "Rédaction", title: "Expression écrite", icon: "pen", tone: "lavender", content: "Une ligne par sujet : tâche 1 à 3, consigne, type de texte, nombre de mots, durée, documents.", files: "Tableur seul", href: "/etudiant/expression-ecrite" },
  { id: "speaking", number: "04", name: "Oral", title: "Expression orale", icon: "mic", tone: "mint", content: "Une ligne par sujet : tâche 1 à 3, consigne, préparation, temps de parole, pistes.", files: "Tableur seul", href: "/etudiant/expression-orale" },
];
const skillOf = (id: Skill) => SKILLS.find(s => s.id === id)!;
const STATUS: Record<Status, { label: string; tone: string }> = {
  draft: { label: "Brouillon", tone: "neutral" }, review: { label: "En relecture", tone: "warn" },
  approved: { label: "Approuvée", tone: "lavender" }, published: { label: "Publiée", tone: "mint" },
};

const MAX_UPLOAD = 250_000_000;
const megabytes = (size: number) => (size / 1_000_000).toLocaleString("fr-CA", { maximumFractionDigits: 1 });

async function download(skill: Skill) {
  const response = await fetch(`/api/v1/bank/templates/${skill}/`, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error("Modèle indisponible : vérifiez vos droits éditoriaux.");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url; link.download = `modele-${skillOf(skill).name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}-fluentia.xlsx`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ImportPage() {
  const [skill, setSkill] = useState<Skill>("reading");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ImportError[] | null>(null);
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [series, setSeries] = useState<Series[] | null>(null);
  const [filter, setFilter] = useState<Skill | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const refresh = useCallback(async () => setSeries(await api<Series[]>("bank/series/")), []);
  useEffect(() => { refresh().catch(e => setFailure((e as Error).message)); }, [refresh]);

  async function run(work: () => Promise<void>) {
    setBusy(true); setFailure(""); setMessage("");
    try { await work(); } catch (e) { setFailure((e as Error).message); } finally { setBusy(false); }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    if (file.size > MAX_UPLOAD) {
      setErrors([]); setSummary(`Le fichier pèse ${megabytes(file.size)} Mo : 250 Mo au plus. Compressez les audios (mono, 22050 Hz) ou séparez la série.`);
      return;
    }
    const form = new FormData();
    form.append("skill", skill); form.append("file", file);
    run(async () => {
      setErrors(null); setSummary("");
      const response = await postForm<Series & { detail?: string; errors?: ImportError[] }>("bank/series/import/", form);
      if (!response.ok) {
        setErrors(response.data.errors ?? []);
        setSummary(response.data.detail ?? (response.status === 413 || response.status >= 500
          ? `L’envoi de ce fichier (${megabytes(file.size)} Mo) a été interrompu par le serveur. Réessayez ; si cela se répète, signalez-le avec la taille du fichier.`
          : "Le fichier a été refusé."));
        return;
      }
      setMessage(`« ${response.data.title} » importée : ${response.data.size} ${["reading", "listening"].includes(skill) ? "questions" : "sujets"} en brouillon. Envoyez-la en relecture.`);
      setFile(null); setOpenId(response.data.id); await refresh();
    });
  }
  const visible = series?.filter(s => filter === "all" || s.skill === filter);
  return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="import-titre">
        <span className="hero-chip-row"><span className="hero-chip">Espace éditorial</span><span>Une série = un fichier Excel</span></span>
        <h2 id="import-titre" className="import-hero-title">Importez une série complète en quelques minutes.</h2>
        <p>Téléchargez le modèle de l’épreuve, remplissez-le, puis déposez-le. Fluentia vérifie chaque ligne avant d’enregistrer quoi que ce soit.</p>
        <ol className="import-steps">{["Télécharger le modèle", "Le remplir", "L’importer", "Relire et publier"].map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
      </section>
      <section className="status-card" aria-labelledby="import-savoir">
        <div className="status-head"><h2 id="import-savoir" className="badge-warn"><Icon name="clock" size={14} />Bon à savoir</h2></div>
        <p className="status-text notice-text">Avec des images ou des audios, mettez le tableur et ses fichiers dans un même dossier compressé (.zip). Les documents doivent être originaux ou utilisés avec autorisation.</p>
        <p className="status-text notice-text">Rien n’est visible des étudiants avant la relecture par une deuxième personne, puis la publication.</p>
      </section>
    </div>

    {failure && <p role="alert" className="import-failure">{failure}</p>}
    <p role="status" className="sr-only">{message}</p>
    {message && <div className="import-success"><Icon name="check" size={16} />{message}</div>}

    <div className="section-title"><h2>1. Télécharger un modèle</h2><p className="section-note">Un modèle par épreuve, chacun avec ses propres colonnes</p></div>
    <div className="series-grid import-templates">{SKILLS.map(s => <article key={s.id} className="series-card template-card" data-tone={s.tone}>
      <div className="series-card-top"><span className="template-icon" aria-hidden="true"><Icon name={s.icon} size={18} /></span><span className="series-version">Épreuve {s.number}</span></div>
      <h3>{s.name}</h3>
      <p>{s.content}</p>
      <div className="pill-row"><span className="pill"><Icon name="layers" size={13} />{s.files}</span></div>
      <Button variant="secondary" disabled={busy} onClick={() => run(() => download(s.id))}><Icon name="download" size={15} />Télécharger le modèle<span className="sr-only"> {s.name}</span></Button>
    </article>)}</div>

    <div className="section-title"><h2>2. Importer le fichier</h2></div>
    <form className="student-card import-form" onSubmit={submit}>
      <fieldset className="import-skills">
        <legend>Épreuve de la série</legend>
        <div className="series-filter" role="group" aria-label="Épreuve de la série">{SKILLS.map(s =>
          <button key={s.id} type="button" aria-pressed={skill === s.id} onClick={() => { setSkill(s.id); setErrors(null); }}><Icon name={s.icon} size={14} />{s.name}</button>)}</div>
      </fieldset>
      <label className="import-drop" data-filled={file ? "" : undefined}>
        <Icon name="upload" size={22} />
        <strong>{file ? file.name : "Choisir le fichier .xlsx ou .zip"}</strong>
        <small>{file ? `${megabytes(file.size)} Mo · cliquez pour changer` : "Le fichier doit venir du modèle " + skillOf(skill).name}</small>
        <input type="file" accept=".xlsx,.zip,application/zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => { setFile(event.target.files?.[0] ?? null); setErrors(null); }} />
      </label>
      <Button type="submit" loading={busy} disabled={!file}><Icon name="upload" size={15} />Importer la série {skillOf(skill).name}</Button>
    </form>
    {errors && <section className="student-card import-errors" aria-labelledby="erreurs">
      <div className="import-errors-head"><span className="bilan-state" data-state="wrong">{errors.length} erreur{errors.length > 1 ? "s" : ""}</span><h3 id="erreurs">{summary}</h3></div>
      <p>Corrigez le fichier puis importez-le de nouveau. Les numéros de ligne sont ceux de l’onglet « Contenu » dans Excel.</p>
      <div className="table-wrap"><table className="import-table"><thead><tr><th scope="col">Ligne</th><th scope="col">Colonne</th><th scope="col">Problème</th></tr></thead>
        <tbody>{errors.map((error, index) => <tr key={index}><td>{error.ligne ?? "—"}</td><td>{error.colonne ?? "—"}</td><td>{error.message}</td></tr>)}</tbody></table></div>
    </section>}

    <div className="section-title"><h2 id="series">3. Relire et publier</h2>
      <div className="series-filter" role="group" aria-label="Filtrer les séries">{([["all", "Toutes"], ...SKILLS.map(s => [s.id, s.name])] as [Skill | "all", string][]).map(([value, label]) =>
        <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
    </div>
    {!series && !failure && <p className="student-hint">Chargement des séries…</p>}
    {visible?.length === 0 && <div className="empty-block"><h3>Aucune série importée</h3><p>Les séries apparaîtront ici dès leur import, en brouillon.</p></div>}
    <ul className="import-list" aria-labelledby="series">{visible?.map(item => <SeriesCard key={item.id} item={item} open={openId === item.id} busy={busy}
      onToggle={() => setOpenId(openId === item.id ? null : item.id)}
      onAction={(action, body, done) => run(async () => { await api(`bank/series/${item.id}/${action}/`, "POST", body ?? {}); setMessage(done); await refresh(); })} />)}</ul>
  </>;
}

function SeriesCard({ item, open, busy, onToggle, onAction }: { item: Series; open: boolean; busy: boolean; onToggle: () => void; onAction: (action: string, body: object | undefined, done: string) => void }) {
  const s = skillOf(item.skill);
  const qcm = item.skill === "reading" || item.skill === "listening";
  const [note, setNote] = useState("");
  const [attest, setAttest] = useState(false);
  return <li className="student-card import-series">
    <div className="import-series-head">
      <span className="template-icon" data-tone={s.tone} aria-hidden="true"><Icon name={s.icon} size={18} /></span>
      <div>
        <p className="import-series-meta"><span>{s.name}</span>{qcm && <span>{item.mode === "simulation" ? "Simulation" : "Entraînement"}</span>}<span>{item.size} {qcm ? "questions" : "sujets"}</span><span>{new Date(item.created_at).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}</span></p>
        <h3>{item.title}</h3>
        <p className="import-file"><Icon name="layers" size={13} />{item.file_name}</p>
      </div>
      <span className="import-status" data-tone={STATUS[item.status].tone}>{STATUS[item.status].label}{item.status === "published" && item.exam ? ` · v${item.exam.version}` : ""}</span>
    </div>
    <ol className="import-track" aria-label="Avancement">{(["draft", "review", "approved", "published"] as Status[]).map((step, index, all) =>
      <li key={step} data-done={all.indexOf(item.status) >= index || undefined}>{STATUS[step].label}</li>)}</ol>
    <div className="import-actions">
      {item.status === "draft" && <Button disabled={busy} onClick={() => onAction("request_review", undefined, "Série envoyée en relecture.")}><Icon name="send" size={15} />Envoyer en relecture</Button>}
      {item.status === "approved" && <Button disabled={busy} onClick={() => onAction("publish", undefined, qcm ? "Série publiée : elle apparaît dans le catalogue des étudiants." : "Sujets publiés : ils remplacent les précédents pour les étudiants.")}><Icon name="flag" size={15} />Publier la série</Button>}
      {item.status === "published" && <Link className="button button-secondary tile-link" href={s.href}>Voir côté étudiant<Icon name="external" size={14} /></Link>}
      <Button variant="secondary" onClick={onToggle} aria-expanded={open}><Icon name="chevron" size={14} />{open ? "Masquer le contenu" : "Voir le contenu"}</Button>
    </div>
    {item.status === "review" && <form className="import-review" onSubmit={event => { event.preventDefault(); onAction("approve", { note, attest }, "Série approuvée : elle peut être publiée."); }}>
      <p><strong>Relecture par une deuxième personne.</strong> La personne qui a importé la série ne peut pas l’approuver.</p>
      <label>Note de relecture<textarea required value={note} onChange={e => setNote(e.target.value)} maxLength={10000} placeholder="Ce que vous avez vérifié : textes, choix, bonnes réponses, droits des documents…" /></label>
      <label className="import-attest"><input type="checkbox" checked={attest} onChange={e => setAttest(e.target.checked)} />J’atteste avoir relu toute la série (textes, choix, réponses, médias) et vérifié les droits des documents.</label>
      <div className="import-actions">
        <Button type="submit" disabled={busy || !note.trim() || !attest}><Icon name="check" size={15} />Approuver la série</Button>
        <Button variant="secondary" disabled={busy || !note.trim()} onClick={() => onAction("reject", { note }, "Série renvoyée en brouillon avec votre note.")}>Renvoyer en brouillon</Button>
      </div>
    </form>}
    {open && <SeriesPreview id={item.id} />}
  </li>;
}

function SeriesPreview({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Detail>(`bank/series/${id}/`).then(setDetail).catch(e => setError((e as Error).message)); }, [id]);
  if (error) return <p role="alert">{error}</p>;
  if (!detail) return <p className="student-hint">Chargement du contenu…</p>;
  if (detail.tasks) return <div className="import-preview">{detail.tasks.map(task => <section key={task.slug} className="import-task">
    <h4>Tâche {task.number} · {task.title}</h4>
    <p className="import-series-meta">{task.genre ? <><span>{task.genre}</span><span>{task.min}–{task.max} mots</span><span>{task.minutes} min</span></> : <><span>Préparation {Math.round((task.prepSeconds ?? 0) / 60 * 10) / 10} min</span><span>Parole {Math.round((task.seconds ?? 0) / 60 * 10) / 10} min</span></>}</p>
    {task.subjects.map(subject => <article key={subject.title} className="import-subject"><strong>{subject.title}</strong><p>{subject.prompt}</p>
      {subject.documents?.map(doc => <p key={doc.label} className="student-passage"><b>{doc.label}</b> — {doc.text}</p>)}
      {subject.cues?.length ? <ul className="pill-row">{subject.cues.map(cue => <li key={cue} className="pill">{cue}</li>)}</ul> : null}
    </article>)}
  </section>)}</div>;
  return <ol className="import-preview bilan-list">{detail.questions?.map(q => <li key={q.id} className="bilan-question import-question">
    <div className="bilan-question-head"><h4><span className="bilan-num">{q.position}</span>{q.statement}</h4><span className="bilan-tags"><span className="pill">{q.level}</span><span className="pill question-points">{q.points} pts</span></span></div>
    {/* Aperçu privé servi par l’API éditoriale. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {q.image && <img className="import-thumb" src={`/api/v1/bank/images/${q.image}/`} alt={q.image_text} />}
    {(q.passage || q.transcript) && <p className="student-passage">{q.passage || q.transcript}</p>}
    <ul className="bilan-choices">{q.choices.map((choice, index) => <li key={index} data-state={index === q.correct_index ? "right" : undefined}>
      <span className="choice-letter" aria-hidden="true">{"ABCD"[index]}</span><span className="sr-only">{"ABCD"[index]}. </span>{choice}
      {index === q.correct_index && <span className="bilan-choice-tags"><span>Bonne réponse</span></span>}
    </li>)}</ul>
    <p className="import-hint">{q.explanation}</p>
  </li>)}</ol>;
}
