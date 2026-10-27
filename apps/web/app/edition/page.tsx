"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { api, fileRequest } from "../../lib/student-api";
import { Button } from "../../components/ui/primitives";

type Item = {id: string; family: string; version: number; revision: number; skill: string; difficulty: string; state: string; statement: string; passage: string; media: string | null; choices: string[]; correct_index: number; explanation: string; origin: string; provenance: string; credit: string};
type Event = {id: number; action: string; actor: number | null; created_at: string; before: unknown; after: unknown};
export default function EditorialPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [item, setItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<Event[]>([]);
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [exportOffset, setExportOffset] = useState(0);
  const [filterSkill, setFilterSkill] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [selectionDetails, setSelectionDetails] = useState<Record<string, Item>>({});
  const refreshVersion = useRef(0);
  const selectionVersion = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++refreshVersion.current;
    const query = new URLSearchParams({limit: "50", offset: String(offset), skill: filterSkill, state: filterState, difficulty: filterDifficulty});
    const data = await api<{results: Item[]; next: string | null}>(`bank/?${query}`);
    if (version !== refreshVersion.current) return;
    setItems(data.results); setMore(Boolean(data.next)); setReady(true);
  }, [offset, filterSkill, filterState, filterDifficulty]);
  useEffect(() => {refresh().catch(e => setError(e.message));}, [refresh]);
  async function action(work: () => Promise<void>) {
    selectionVersion.current += 1;
    setBusy(true); setError(""); setMessage("");
    try {await work(); await refresh();} catch (e) {setError((e as Error).message);} finally {setBusy(false);}
  }
  async function choose(value: Item) {
    const version = ++selectionVersion.current;
    setItem(value); setHistory([]); setError("");
    try {const data = await api<Event[]>(`bank/${value.id}/history/`); if (version === selectionVersion.current) setHistory(data);} catch (e) {if (version === selectionVersion.current) setError((e as Error).message);}
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const {c0, c1, c2, c3, ...fields} = values;
    const data = {...fields, choices: [c0,c1,c2,c3], correct_index: Number(fields.correct_index), media: fields.media || null, ...(item ? {revision: item.revision} : {})};
    action(async () => {const result = await api<Item>(item ? `bank/${item.id}/` : "bank/", item ? "PUT" : "POST", data); setItem(result); setMessage("Brouillon enregistré. Aucune validation humaine n’a été appliquée."); setHistory(await api<Event[]>(`bank/${result.id}/history/`));});
  }
  function transition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!item) return;
    const fields = new FormData(event.currentTarget);
    action(async () => {const result = await api<Item>(`bank/${item.id}/transition/`, "POST", {revision: item.revision, action: fields.get("action"), note: fields.get("note"), attest: fields.get("attest") === "on"}); setItem(result); setHistory(await api<Event[]>(`bank/${result.id}/history/`)); setMessage("Transition enregistrée dans l’historique.");});
  }
  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = Object.fromEntries(new FormData(event.currentTarget));
    action(async () => {const result = await api<{title: string; version: number}>("bank/publish/", "POST", {...fields, duration_seconds: Number(fields.duration_seconds), item_ids: selected}); setMessage(`${result.title}, version ${result.version}, publié. L’ordre des questions suit l’ordre de sélection.`); setSelected([]);});
  }
  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = new FormData(event.currentTarget);
    action(async () => {const result = await (await fileRequest("bank/media/", "POST", fields)).json(); setMessage(`Média privé enregistré : ${result.id}. Reportez cet identifiant dans le brouillon. Durée : ${result.duration_ms} ms.`);});
  }
  return <><div className="page-head"><div><p className="student-eyebrow">Espace éditorial réservé aux personnes habilitées</p><h2 className="page-title">Construire une banque fiable</h2>
    <p>Les difficultés sont proposées, sans calibration. Aucun contenu n’est publié par un import ou par une génération. La relecture doit être réalisée par une personne distincte du responsable éditorial.</p></div></div>
    {error && <p role="alert">{error}</p>}<p role="status">{message}</p>
    {!ready && !error && <p className="student-hint">Chargement de la banque…</p>}
    {ready && <>
      <section className="student-card" id="banque"><div className="section-title" style={{marginTop: 0}}><h2>Versions de la banque</h2><Button variant="secondary" disabled={busy} onClick={() => {setItem(null); setHistory([]);}}>Nouveau brouillon</Button></div>
        <div className="student-form form-row"><label>Filtrer par compétence<select value={filterSkill} onChange={e => {setOffset(0); setFilterSkill(e.target.value);}}><option value="">Toutes</option><option value="reading">Compréhension écrite</option><option value="listening">Compréhension orale</option></select></label><label>Filtrer par état<select value={filterState} onChange={e => {setOffset(0); setFilterState(e.target.value);}}><option value="">Tous</option><option value="draft">Brouillon</option><option value="review">En révision</option><option value="approved">Approuvé</option><option value="published">Publié</option></select></label><label>Filtrer par difficulté<select value={filterDifficulty} onChange={e => {setOffset(0); setFilterDifficulty(e.target.value);}}><option value="">Toutes</option>{["non_calibree","A1","A2","B1","B2","C1","C2"].map(v => <option value={v} key={v}>{v}</option>)}</select></label></div>
        {!items.length && <p>Aucun item dans cette page.</p>}
        <ul className="activity-list bank-list" tabIndex={0} aria-label="Items de la banque">{items.map(value => <li key={value.id}><Button variant="ghost" disabled={busy} onClick={() => choose(value)} aria-pressed={item?.id === value.id}>{value.statement} · v{value.version} · {value.state}</Button>
          {["approved", "published"].includes(value.state) && <label><input type="checkbox" checked={selected.includes(value.id)} onChange={e => {setSelectionDetails(previous => ({...previous, [value.id]: value})); setSelected(previous => e.target.checked ? [...previous, value.id] : previous.filter(id => id !== value.id));}} /> Ajouter à l’examen</label>}
        </li>)}</ul>
        <div className="student-nav"><Button variant="secondary" disabled={offset === 0 || busy} onClick={() => setOffset(Math.max(0, offset - 50))}>Page précédente</Button><Button variant="secondary" disabled={!more || busy} onClick={() => setOffset(offset + 50)}>Page suivante</Button></div>
      </section>
      <section className="student-card" id="editeur"><h2>{item ? `Version ${item.version} · ${item.state}` : "Créer une question originale"}</h2>
        <form key={item ? item.id + item.revision : "new"} onSubmit={save} className="student-form"><fieldset disabled={busy || !!item && item.state !== "draft"}>
          <label>Compétence<select name="skill" defaultValue={item?.skill ?? "reading"}><option value="reading">Compréhension écrite</option><option value="listening">Compréhension orale</option></select></label>
          <label>Difficulté proposée<select name="difficulty" defaultValue={item?.difficulty ?? "non_calibree"}>{["non_calibree","A1","A2","B1","B2","C1","C2"].map(v => <option value={v} key={v}>{v}</option>)}</select></label>
          <label>Question<textarea name="statement" required maxLength={10000} defaultValue={item?.statement ?? ""} /></label>
          <label>Texte de lecture<textarea name="passage" maxLength={40000} defaultValue={item?.passage ?? ""} /></label>
          <label>Identifiant du média privé<input name="media" defaultValue={item?.media ?? ""} /></label>
          {[0,1,2,3].map(index => <label key={index}>Choix {index + 1}<input name={`c${index}`} required maxLength={500} defaultValue={item?.choices[index] ?? ""} /></label>)}
          <label>Réponse correcte<select name="correct_index" defaultValue={item?.correct_index ?? 0}>{[0,1,2,3].map(i => <option key={i} value={i}>Choix {i + 1}</option>)}</select></label>
          <label>Explication<textarea name="explanation" required maxLength={10000} defaultValue={item?.explanation ?? ""} /></label>
          <label>Origine<select name="origin" defaultValue={item?.origin ?? "original"}><option value="original">Original</option><option value="licensed">Sous licence</option></select></label>
          <label>Provenance et autorisation<textarea name="provenance" required maxLength={10000} defaultValue={item?.provenance ?? ""} /></label>
          <label>Attribution réelle<input name="credit" maxLength={250} defaultValue={item?.credit ?? ""} /></label>
          <Button type="submit" loading={busy}>Enregistrer le brouillon</Button>
        </fieldset></form>
        {item && <Button variant="secondary" disabled={busy} onClick={() => action(async () => {const copy = await api<Item>(`bank/${item.id}/versions/`, "POST"); setItem(copy); setHistory([]); setMessage("Nouvelle version en brouillon. La validation n’a pas été héritée.");})}>Créer une nouvelle version</Button>}
      </section>
      {item && <section className="student-card" id="relecture"><h2>Relecture humaine</h2><form className="student-form" onSubmit={transition}>
        <label>Décision<select name="action"><option value="request_review">Demander une relecture</option><option value="approve">Approuver après relecture</option><option value="reject">Retourner en brouillon</option></select></label>
        <label>Note de relecture<textarea name="note" maxLength={10000} /></label>
        <label><input type="checkbox" name="attest" /> J’atteste avoir réellement relu le texte, les choix, l’explication, le média éventuel et leurs droits. Je suis distinct du responsable éditorial.</label>
        <Button type="submit" loading={busy}>Enregistrer la décision</Button>
      </form><details><summary>Historique complet ({history.length})</summary>{history.map(h => <article key={h.id}><p>{h.action} · Compte {h.actor ?? "non attribué"} · {h.created_at}</p><pre className="editorial-history">{JSON.stringify({before:h.before, after:h.after}, null, 2)}</pre></article>)}</details></section>}
      <section className="student-card" id="medias"><h2>Ajouter un support audio autorisé</h2><p>WAV PCM, 20 Mo et 15 minutes maximum. La transcription doit comprendre le document et la question. Ne chargez pas d’audio propriétaire sans autorisation.</p><form className="student-form" onSubmit={upload}>
        <label>Titre du média<input name="title" required maxLength={180} /></label><label>Document WAV<input name="file" type="file" accept="audio/wav,.wav" required /></label><label>Transcription<textarea name="transcript" required maxLength={40000} /></label><label>Provenance du média et droits<textarea name="provenance" required maxLength={10000} /></label><Button type="submit" loading={busy}>Importer le média privé</Button>
      </form></section>
      <section className="student-card" id="publication"><h2>Publier une version d’examen</h2><p>{selected.length} items sélectionnés, dans l’ordre des cases cochées. Une simulation requiert 39 questions et 3600 secondes en lecture ou 2100 secondes à l’oral. Tous les items doivent être approuvés et de même compétence.</p><form className="student-form" onSubmit={publish}>
        <Button variant="secondary" disabled={busy || !selected.length} onClick={() => setSelected(previous => [...previous].sort((a,b) => ["non_calibree","A1","A2","B1","B2","C1","C2"].indexOf(selectionDetails[a]?.difficulty) - ["non_calibree","A1","A2","B1","B2","C1","C2"].indexOf(selectionDetails[b]?.difficulty)))}>Ordonner par difficulté proposée</Button>
        <ol>{selected.map((id,index) => <li key={id}>{selectionDetails[id]?.statement} · {selectionDetails[id]?.difficulty}<Button variant="ghost" aria-label={`Monter la question ${index+1}`} disabled={busy || index === 0} onClick={() => setSelected(previous => {const next=[...previous]; [next[index-1],next[index]]=[next[index],next[index-1]]; return next;})}>↑</Button><Button variant="ghost" aria-label={`Descendre la question ${index+1}`} disabled={busy || index === selected.length-1} onClick={() => setSelected(previous => {const next=[...previous]; [next[index],next[index+1]]=[next[index+1],next[index]]; return next;})}>↓</Button></li>)}</ol>
        <label>Identifiant stable de l’examen<input name="slug" required maxLength={120} pattern="[a-zA-Z0-9_-]+" /></label><label>Titre de l’examen<input name="title" required maxLength={180} /></label><label>Description<textarea name="description" maxLength={10000} /></label>
        <label>Compétence de l’examen<select name="skill"><option value="reading">Compréhension écrite</option><option value="listening">Compréhension orale</option></select></label><label>Mode<select name="mode"><option value="training">Entraînement</option><option value="simulation">Simulation</option></select></label><label>Durée en secondes<input type="number" name="duration_seconds" min={1} max={14400} required defaultValue={600} /></label><Button type="submit" disabled={!selected.length} loading={busy}>Publier les items sélectionnés</Button>
      </form></section>
      <section className="student-card" id="transfert"><h2>Import et export structurés</h2><p>Format fluentia.bank.v1, 100 items et 2 Mo maximum par import. Les statuts et relecteurs ne peuvent pas être importés. Les médias doivent déjà exister dans cet environnement.</p>
        <label>Fichier JSON de brouillons<input type="file" accept="application/json,.json" disabled={busy} onChange={event => {const file = event.target.files?.[0]; if (!file) return; action(async () => {if (file.size > 2_000_000) throw new Error("Fichier limité à 2 Mo."); await api("bank/import/", "POST", JSON.parse(await file.text())); setMessage("Import en brouillon terminé ; une relecture humaine est requise.");});}} /></label>
        <label>Début du lot exporté (offset)<input type="number" min={0} step={100} value={exportOffset} onChange={event => setExportOffset(Math.max(0, Number(event.target.value)))} /></label>
        <Button variant="secondary" disabled={busy} onClick={() => action(async () => {const data = await api(`bank/export/?offset=${exportOffset}`); const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], {type:"application/json"})); const link = document.createElement("a"); link.href = url; link.download = `banque-lot-${exportOffset}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage("Lot exporté (100 items maximum). Augmentez l’offset de 100 pour le lot suivant ; l’ordre est stable tant que les données ne changent pas.");})}>Exporter un lot de 100 items</Button>
      </section>
    </>}
  </>;
}
