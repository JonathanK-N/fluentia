export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
let csrf = "";
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  if (method !== "GET") {
    // Le jeton change à la connexion : toujours prendre la valeur courante.
    const response = await fetch("/api/v1/auth/csrf/", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new ApiError(response.status, "La session ne peut pas être sécurisée. Réessayez.");
    csrf = (await response.json()).csrf_token;
  }
  const response = await fetch(`/api/v1/${path}`, {
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
export type Profile = { id: number; email: string; display_name: string; email_verified: boolean };
export type Exam = { id: string; title: string; description: string; skill: string; question_count: number; duration_seconds: number };
export type Question = { id: string; statement: string; reading_passage: string; choices: {id: string; label: string}[] };
export type Attempt = {id: string; status: string; expires_at: string; questions?: Question[]; answers: {question_id: string; choice_id: string}[]};
export type Results = { correct_count: number; question_count: number; percentage: number; disclaimer: string; details: {question_id: string; selected_choice_id: string | null; correct_choice_id: string; explanation: string; statement: string; selected_label: string | null; correct_label: string}[] };
