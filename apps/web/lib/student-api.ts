export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
let csrf = "";
async function http(input: string, init: RequestInit) {
  try { return await fetch(input, init); }
  catch { throw new ApiError(0, "Connexion interrompue. Vérifiez votre réseau puis réessayez ; seules les réponses confirmées sont enregistrées."); }
}
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  if (method !== "GET") {
    // Le jeton change à la connexion : toujours prendre la valeur courante.
    const response = await http("/api/v1/auth/csrf/", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new ApiError(response.status, "La session ne peut pas être sécurisée. Réessayez.");
    csrf = (await response.json()).csrf_token;
  }
  const response = await http(`/api/v1/${path}`, {
    method, credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", ...(method !== "GET" ? { "X-CSRFToken": csrf } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data.detail === "string" ? data.detail :
      Object.values(data).flat().filter(v => typeof v === "string").join(" ");
    throw new ApiError(response.status, message || "Cette action a échoué. Vos réponses déjà enregistrées sont conservées.");
  }
  return data as T;
}
export type Subscription = { status: "free" | "premium" | "expired"; premium_until: string | null; days_remaining: number };
export type Profile = { id: number; email: string; display_name: string; email_verified: boolean; editor: boolean; preferences: { live_correction: boolean; answer_sound: boolean }; subscription: Subscription };
export type SavedAnswer = { question_id: string; choice_id: string; saved: boolean; correct: boolean | null };
export type Exam = { id: string; title: string; description: string; skill: string; mode: string; version: number; question_count: number; total_points: number; duration_seconds: number };
export type Question = { id: string; position: number; statement: string; reading_passage: string; image_available: boolean; image_text: string; points: number; audio_available: boolean; audio_state: string; audio_ends_at?: string; transcript?: string; choices: {id: string; label: string}[] };
export type Attempt = {id: string; exam_id: string; status: string; skill: string; mode: string; exam_title: string; expires_at: string; server_now: string; questions?: Question[]; answers: {question_id: string; choice_id: string}[]};
export type AttemptSummary = Pick<Attempt, "id" | "status" | "expires_at" | "skill" | "mode" | "exam_title">;
export type Results = { correct_count: number; question_count: number; percentage: number; score: number; max_score: number; disclaimer: string; details: {question_id: string; selected_choice_id: string | null; correct_choice_id: string; explanation: string; points: number; statement: string; reading_passage: string; image_available: boolean; image_text: string; choices: {id: string; position: number; label: string}[]; selected_label: string | null; correct_label: string; transcript?: string}[] };

export async function fileRequest(path: string, method: string, body?: FormData): Promise<Response> {
  const csrfResponse = await http("/api/v1/auth/csrf/", {credentials: "same-origin", cache: "no-store"});
  if (!csrfResponse.ok) throw new ApiError(csrfResponse.status, "Impossible de sécuriser la session.");
  const token = (await csrfResponse.json()).csrf_token;
  const response = await http(`/api/v1/${path}`, {method, credentials: "same-origin", cache: "no-store", headers: {"X-CSRFToken": token}, body});
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(response.status, typeof data.detail === "string" ? data.detail : "Document indisponible. Vérifiez votre session et la validité de la tentative.");
  }
  return response;
}

/** Envoi d’un formulaire multipart ; renvoie aussi le corps des erreurs (ex. la liste des lignes refusées). */
export async function postForm<T>(path: string, body: FormData): Promise<{ ok: boolean; status: number; data: T }> {
  const csrfResponse = await http("/api/v1/auth/csrf/", {credentials: "same-origin", cache: "no-store"});
  if (!csrfResponse.ok) throw new ApiError(csrfResponse.status, "Impossible de sécuriser la session.");
  const token = (await csrfResponse.json()).csrf_token;
  const response = await http(`/api/v1/${path}`, {method: "POST", credentials: "same-origin", cache: "no-store", headers: {"X-CSRFToken": token}, body});
  return { ok: response.ok, status: response.status, data: await response.json().catch(() => ({})) as T };
}
