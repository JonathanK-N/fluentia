"use client";
/** Examens TCF : composer les 4 épreuves de chaque examen, le publier ou le retirer, sans l’administration Django. */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/primitives";
import { Icon, type IconName } from "../../../components/app-shell/icons";
import { api } from "../../../lib/student-api";

type Field = "listening" | "reading" | `${"writing" | "speaking"}_${1 | 2 | 3}`;
type Option = { id: string | number; label: string };
type MockExam = { id: number; title: string; position: number; is_published: boolean; complete: boolean; runs: number } & Record<Field, string | number | null>;
type Data = { exams: MockExam[]; options: Record<Field, Option[]> };
type Draft = { id?: number; title: string; position: number; is_published: boolean } & Record<Field, string>;

const PARTS: { name: string; icon: IconName; fields: { key: Field; label: string }[] }[] = [
  { name: "1. Écoute", icon: "headphones", fields: [{ key: "listening", label: "Série d’Écoute" }] },
  { name: "2. Lecture", icon: "book", fields: [{ key: "reading", label: "Série de Lecture" }] },
  { name: "3. Rédaction", icon: "pen", fields: [1, 2, 3].map(n => ({ key: `writing_${n}` as Field, label: `Sujet de la tâche ${n}` })) },
  { name: "4. Oral", icon: "mic", fields: [1, 2, 3].map(n => ({ key: `speaking_${n}` as Field, label: `Sujet de la tâche ${n}` })) },
];
const FIELDS: Field[] = PARTS.flatMap(part => part.fields.map(field => field.key));

const empty = (position: number): Draft => ({ title: `Examen TCF ${position}`, position, is_published: false, ...Object.fromEntries(FIELDS.map(key => [key, ""])) as Record<Field, string> });
const toDraft = (exam: MockExam): Draft => ({ id: exam.id, title: exam.title, position: exam.position, is_published: exam.is_published, ...Object.fromEntries(FIELDS.map(key => [key, exam[key] == null ? "" : String(exam[key])])) as Record<Field, string> });
const payload = (draft: Draft) => ({ title: draft.title, position: draft.position, is_published: draft.is_published, ...Object.fromEntries(FIELDS.map(key => [key, draft[key] || null])) });

export default function MockExamsEditorPage() {
  const [data, setData] = useState<Data | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [failure, setFailure] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => setData(await api<Data>("bank/mock-exams/")), []);
  useEffect(() => { refresh().catch(e => setFailure((e as Error).message)); }, [refresh]);

  async function run(work: () => Promise<void>, done: string) {
    setBusy(true); setFailure(""); setMessage("");
    try { await work(); await refresh(); setMessage(done); } catch (e) { setFailure((e as Error).message); } finally { setBusy(false); }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    run(async () => {
      await api(draft.id ? `bank/mock-exams/${draft.id}/` : "bank/mock-exams/", draft.id ? "PUT" : "POST", payload(draft));
      setDraft(null);
    }, draft.is_published ? "Examen enregistré et publié : il est visible dans Simulations TCF." : "Examen enregistré. Publiez-le quand les 4 épreuves sont prêtes.");
  }
  const label = (key: Field, value: string | number | null) => data?.options[key].find(option => String(option.id) === String(value))?.label;

  return <>
    <div className="home-top">
      <section className="hero-card" aria-labelledby="examens-titre">
        <span className="hero-chip-row"><span className="hero-chip">Espace éditorial</span><span>Simulations TCF</span></span>
        <h2 id="examens-titre" className="import-hero-title">Composez vos Examens TCF.</h2>
        <p>Chaque examen réunit les 4 épreuves dans l’ordre du test : une série d’Écoute, une série de Lecture, 3 sujets de Rédaction et 3 sujets d’Oral.</p>
      </section>
      <section className="status-card" aria-labelledby="examens-savoir">
        <div className="status-head"><h2 id="examens-savoir" className="badge-warn"><Icon name="clock" size={14} />Bon à savoir</h2></div>
        <p className="status-text notice-text">Seules les séries publiées et les sujets publiés sont proposés. Un examen n’est visible des étudiants qu’une fois publié, avec ses 4 épreuves choisies.</p>
      </section>
    </div>

    {failure && <p role="alert" className="import-failure">{failure}</p>}
    <p role="status" className="sr-only">{message}</p>
    {message && <div className="import-success"><Icon name="check" size={16} />{message}</div>}

    {draft
      ? <form className="student-card student-form mock-editor" onSubmit={save} aria-labelledby="formulaire">
        <h2 id="formulaire">{draft.id ? `Modifier « ${draft.title} »` : "Nouvel examen"}</h2>
        <div className="mock-editor-row">
          <label>Titre<input required maxLength={180} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
          <label>Ordre d’affichage<input type="number" min={1} max={999} value={draft.position} onChange={e => setDraft({ ...draft, position: Number(e.target.value) || 1 })} /></label>
        </div>
        {PARTS.map(part => <fieldset key={part.name} className="mock-editor-part">
          <legend><Icon name={part.icon} size={15} />{part.name}</legend>
          {part.fields.map(field => <label key={field.key}>{field.label}
            <select value={draft[field.key]} onChange={e => setDraft({ ...draft, [field.key]: e.target.value })}>
              <option value="">— Choisir —</option>
              {data?.options[field.key].map(option => <option key={option.id} value={String(option.id)}>{option.label}</option>)}
            </select>
          </label>)}
        </fieldset>)}
        <label><input type="checkbox" checked={draft.is_published} onChange={e => setDraft({ ...draft, is_published: e.target.checked })} />Publier : l’examen apparaît dans Simulations TCF (les 4 épreuves doivent être choisies).</label>
        <div className="mock-editor-actions">
          <Button type="submit" loading={busy}><Icon name="check" size={15} />Enregistrer</Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => setDraft(null)}>Annuler</Button>
        </div>
      </form>
      : <div className="section-title"><h2>Vos examens</h2><Button disabled={!data} onClick={() => setDraft(empty((data?.exams.length ?? 0) + 1))}><Icon name="spark" size={15} />Nouvel examen</Button></div>}

    {!data && !failure && <p className="student-hint">Chargement des examens…</p>}
    {data?.exams.length === 0 && !draft && <div className="empty-block"><h3>Aucun examen pour le moment</h3><p>Créez le premier : choisissez ses 4 épreuves, puis publiez-le.</p></div>}
    {!draft && <div className="series-grid mock-grid">{data?.exams.map(exam => <article key={exam.id} className="series-card mock-card">
      <div className="series-card-top">
        <span className="series-kind" data-mode={exam.is_published ? "training" : "simulation"}>{exam.is_published ? "Publié" : exam.complete ? "Prêt à publier" : "Incomplet"}</span>
        <span className="series-version">{exam.runs} passage{exam.runs > 1 ? "s" : ""}</span>
      </div>
      <h3>{exam.title}</h3>
      <ol className="mock-parts">{PARTS.map(part => <li key={part.name}>
        <span className="mock-part-icon" aria-hidden="true"><Icon name={part.icon} size={15} /></span>
        <span><strong>{part.name}</strong>{part.fields.map(field => <small key={field.key}>{label(field.key, exam[field.key]) ?? <em>À choisir</em>}</small>)}</span>
      </li>)}</ol>
      <div className="mock-editor-actions">
        <Button variant="secondary" disabled={busy} onClick={() => setDraft(toDraft(exam))}><Icon name="pen" size={14} />Modifier</Button>
        {exam.is_published
          ? <Button variant="secondary" disabled={busy} onClick={() => run(() => api(`bank/mock-exams/${exam.id}/`, "PUT", { is_published: false }), "Examen retiré : il n’est plus visible des étudiants.")}>Retirer</Button>
          : <Button disabled={busy || !exam.complete} onClick={() => run(() => api(`bank/mock-exams/${exam.id}/`, "PUT", { is_published: true }), "Examen publié : il est visible dans Simulations TCF.")}>Publier</Button>}
        {exam.runs === 0 && <Button variant="ghost" disabled={busy} aria-label={`Supprimer ${exam.title}`}
          onClick={() => { if (window.confirm(`Supprimer « ${exam.title} » ?`)) run(() => api(`bank/mock-exams/${exam.id}/`, "DELETE"), "Examen supprimé."); }}><Icon name="trash" size={14} /></Button>}
      </div>
    </article>)}</div>}
  </>;
}
