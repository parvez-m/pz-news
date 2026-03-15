const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pz_token");
}

export function isGuest(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("pz_guest") === "true";
}

export function clearSession(): void {
  localStorage.removeItem("pz_token");
  localStorage.removeItem("pz_guest");
}

// ── Base fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signInWithGoogle(
  idToken: string
): Promise<{ token: string; expires_in: number }> {
  return apiFetch("/api/v1/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

export async function exchangeAuthCode(
  code: string,
  redirectUri: string
): Promise<{ token: string; expires_in?: number }> {
  return apiFetch("/api/v1/auth/google", {
    method: "POST",
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });
}

export async function signOut(): Promise<void> {
  await apiFetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
  clearSession();
}

// ── Topics ─────────────────────────────────────────────────────────────────────

export type TopicType = "keyword" | "youtube_channel" | "youtube_playlist";

export type Topic = {
  id: string;
  type: TopicType;
  value: string;
  display_name: string | null;
  is_active: number;
  is_archived: number;
  created_at: number;
};

export async function createTopic(
  type: TopicType,
  value: string
): Promise<{ id: string }> {
  return apiFetch("/api/v1/topics", {
    method: "POST",
    body: JSON.stringify({ type, value }),
  });
}

export async function getTopics(): Promise<Topic[]> {
  const res = await apiFetch<{ topics: Topic[] }>("/api/v1/topics");
  return res.topics;
}

export async function deleteTopic(id: string): Promise<void> {
  return apiFetch(`/api/v1/topics/${id}`, { method: "DELETE" });
}

export async function archiveTopic(id: string, archived: boolean): Promise<void> {
  return apiFetch(`/api/v1/topics/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_archived: archived ? 1 : 0 }),
  });
}

// ── Summaries ─────────────────────────────────────────────────────────────────

export type Summary = {
  id: string;
  topic_id: string;
  title: string;
  intro: string;
  bullets: string | string[];
  closing: string;
  source_urls: string | string[];
  source_names: string | string[];
  key_terms: string | string[];
  sentiment: "positive" | "neutral" | "negative";
  published_at: number;
};

export async function getSummaries(params?: {
  topic_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ summaries: Summary[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.topic_id) qs.set("topic_id", params.topic_id);
  if (params?.limit)    qs.set("limit", String(params.limit));
  if (params?.offset)   qs.set("offset", String(params.offset));
  const q = qs.toString();
  return apiFetch(`/api/v1/summaries${q ? `?${q}` : ""}`);
}

// ── Glossary ──────────────────────────────────────────────────────────────────

export type GlossaryTerm = {
  id: string;
  topic_id: string;
  term: string;
  definition: string;
  created_at: number;
};

export async function getGlossary(): Promise<GlossaryTerm[]> {
  return apiFetch("/api/v1/glossary");
}

// ── Refresh ───────────────────────────────────────────────────────────────────

// ── Quiz ──────────────────────────────────────────────────────────────────────

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_index?: number; // absent until submitted
};

export type Quiz = {
  id: string;
  topic_id: string;
  questions: QuizQuestion[];
  score: number | null;
  completed_at: number | null;
  created_at: number;
};

export async function generateTopicQuiz(
  topicId: string
): Promise<Quiz> {
  const res = await apiFetch<{ quiz: Quiz }>("/api/v1/quiz/generate", {
    method: "POST",
    body: JSON.stringify({ topic_id: topicId }),
  });
  return res.quiz;
}

export async function getTopicQuiz(topicId: string): Promise<Quiz> {
  const res = await apiFetch<{ quiz: Quiz }>(`/api/v1/quiz?topic_id=${topicId}`);
  return res.quiz;
}

export async function submitQuiz(
  quizId: string,
  answers: number[]
): Promise<{ quiz: Quiz & { total: number } }> {
  return apiFetch(`/api/v1/quiz/${quizId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function triggerRefresh(): Promise<{ job_id: string }> {
  return apiFetch("/api/v1/refresh", { method: "POST" });
}

export async function getRefreshStatus(
  jobId: string
): Promise<{ status: string; error_text?: string }> {
  return apiFetch(`/api/v1/refresh/status/${jobId}`);
}
