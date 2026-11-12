/** Logique de la conversation avec l’examinateur IA, testée sans micro ni WebRTC. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { addUsage, audioToText, emptyUsage, readEvent, upsertTurn, type ExaminerHandlers, type RealtimeEvent, type Turn, type Usage } from "../lib/examiner";
import { ExaminerSession } from "../features/student/examiner-session";

function collect() {
  const turns: Turn[] = [], activities: string[] = [], errors: string[] = [];
  let usage: Usage = emptyUsage();
  const handlers: ExaminerHandlers = {
    onActivity: activity => activities.push(activity),
    onTurn: turn => turns.push(turn),
    onUsage: part => { usage = addUsage(usage, part); },
    onError: message => errors.push(message),
  };
  return { handlers, turns, activities, errors, usage: () => usage };
}

describe("événements de l’examinateur", () => {
  it("suit qui parle", () => {
    const c = collect();
    readEvent({ type: "output_audio_buffer.started" }, c.handlers);
    readEvent({ type: "output_audio_buffer.stopped" }, c.handlers);
    readEvent({ type: "input_audio_buffer.speech_started", item_id: "a" }, c.handlers);
    readEvent({ type: "input_audio_buffer.speech_stopped", item_id: "a" }, c.handlers);
    expect(c.activities).toEqual(["examiner", "waiting", "candidate", "waiting"]);
  });

  it("lit les transcriptions des deux voix", () => {
    const c = collect();
    readEvent({ type: "response.output_audio_transcript.done", item_id: "e1", transcript: " Bonjour, présentez-vous. " }, c.handlers);
    readEvent({ type: "conversation.item.input_audio_transcription.completed", item_id: "c1", transcript: "Je m’appelle Awa.", usage: { type: "duration", seconds: 4.5 } }, c.handlers);
    expect(c.turns).toEqual([
      { id: "e1", role: "examiner", text: "Bonjour, présentez-vous.", final: true },
      { id: "c1", role: "candidate", text: "Je m’appelle Awa.", final: true },
    ]);
    expect(c.usage().transcription_seconds).toBe(4.5);
  });

  it("additionne la consommation de chaque réponse, cache déduit", () => {
    const c = collect();
    const done = { type: "response.done", response: { usage: {
      input_token_details: { audio_tokens: 1000, text_tokens: 300, cached_tokens_details: { audio_tokens: 400, text_tokens: 100 } },
      output_token_details: { audio_tokens: 250, text_tokens: 40 },
    } } };
    readEvent(done, c.handlers);
    readEvent(done, c.handlers);
    expect(c.usage()).toEqual({ audio_in: 1200, cached_audio_in: 800, text_in: 400, cached_text_in: 200, audio_out: 500, text_out: 80, transcription_seconds: 0, transcription_in: 0, transcription_out: 0 });
  });

  it("signale une erreur du fournisseur", () => {
    const c = collect();
    readEvent({ type: "error", error: { message: "quota" } }, c.handlers);
    expect(c.errors[0]).toContain("quota");
  });
});

describe("réponses du candidat passées en texte", () => {
  function replay(events: RealtimeEvent[], responding = false) {
    const sent: RealtimeEvent[] = [];
    const replacing = audioToText(event => sent.push(event));
    events.forEach(event => replacing.read(event, responding));
    return sent;
  }
  const committed = (id: string, previous: string) => ({ type: "input_audio_buffer.committed", item_id: id, previous_item_id: previous });
  const transcribed = (id: string, transcript: string) => ({ type: "conversation.item.input_audio_transcription.completed", item_id: id, transcript });

  it("remplace l’audio par son texte, à sa place, quand l’examinateur a réagi", () => {
    const sent = replay([committed("item_a", "item_exam1"), transcribed("item_a", "Je viens de Guinée."), { type: "response.done" }]);
    expect(sent).toEqual([
      { type: "conversation.item.delete", item_id: "item_a" },
      { type: "conversation.item.create", previous_item_id: "item_exam1",
        item: { id: "fl_txt_1", type: "message", role: "user", content: [{ type: "input_text", text: "[Réponse orale du candidat, transcrite] Je viens de Guinée." }] } },
    ]);
  });

  it("garde l’audio tant que la réponse n’est pas transcrite ou que l’examinateur n’a pas réagi", () => {
    expect(replay([committed("item_a", "x"), transcribed("item_a", "Bonjour.")])).toEqual([]);
    expect(replay([committed("item_a", "x"), { type: "response.done" }])).toEqual([]);
  });

  it("n’envoie rien pendant que l’examinateur répond", () => {
    expect(replay([committed("item_a", "x"), transcribed("item_a", "Bonjour."), { type: "response.done" }], true)).toEqual([]);
  });

  it("garde l’ordre quand la réponse précédente a déjà été remplacée", () => {
    const sent = replay([
      committed("item_a", "item_exam1"), transcribed("item_a", "Un."), { type: "response.done" },
      committed("item_b", "item_a"), transcribed("item_b", "Deux."), { type: "response.done" },
    ]);
    expect(sent[3]).toMatchObject({ type: "conversation.item.create", previous_item_id: "fl_txt_1" });
  });
});

describe("ordre de la transcription", () => {
  it("garde la place du candidat quand sa transcription arrive après la réponse de l’examinateur", () => {
    let turns: Turn[] = [];
    turns = upsertTurn(turns, { id: "c1", role: "candidate", text: "", final: false });
    turns = upsertTurn(turns, { id: "e2", role: "examiner", text: "Très bien.", final: true });
    turns = upsertTurn(turns, { id: "c1", role: "candidate", text: "J’habite à Montréal.", final: true });
    expect(turns.map(t => [t.id, t.text])).toEqual([["c1", "J’habite à Montréal."], ["e2", "Très bien."]]);
  });
});

describe("écran d’accueil", () => {
  it("dit à l’étudiant à qui sa voix est envoyée avant de commencer", () => {
    const task = { slug: "tache-1", number: 1, title: "Entretien dirigé", seconds: 120, prepSeconds: 0, goal: "", advice: [], subjects: [] };
    const subject = { id: 9, title: "Se présenter", prompt: "Présentez-vous.", cues: [] };
    render(<ExaminerSession task={task} subject={subject} examiner="OpenAI" onExit={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Se présenter" })).toBeTruthy();
    expect(screen.getByText("OpenAI")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Commencer avec l’examinateur/ })).toBeTruthy();
  });
});
