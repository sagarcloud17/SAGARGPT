import type { HealthResponse, StreamEvent } from "./types";

/**
 * Browser calls same-origin Next.js proxies (`/api/*`).
 * Those routes attach Authorization: Bearer <API_SECRET> to FastAPI.
 * Never put API_SECRET in NEXT_PUBLIC_* env vars.
 */
async function appFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith("/") ? path : `/${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    return await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await appFetch("/api/health", { method: "GET" });
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json() as Promise<HealthResponse>;
}

export async function streamChat(params: {
  message: string;
  history: { role: string; content: string }[];
  signal?: AbortSignal;
  onEvent: (event: StreamEvent) => void;
}): Promise<void> {
  const res = await appFetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({
      message: params.message,
      history: params.history,
    }),
    signal: params.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Chat failed (${res.status})`);
  }
  if (!res.body) throw new Error("No response stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"));
      if (!line) continue;
      const raw = line.replace(/^data:\s*/, "");
      if (!raw || raw === "[DONE]") continue;
      try {
        const event = JSON.parse(raw) as StreamEvent;
        params.onEvent(event);
      } catch {
        /* skip malformed chunk */
      }
    }
  }
}

export const candidateName =
  process.env.NEXT_PUBLIC_CANDIDATE_NAME || "Bantu Sagar Kumar";
export const candidateShortName =
  process.env.NEXT_PUBLIC_CANDIDATE_SHORT_NAME || "Bantu";
export const linkedInUrl =
  process.env.NEXT_PUBLIC_LINKEDIN_URL ||
  "https://www.linkedin.com/in/your-profile";

/** Same-origin resume proxy (attaches Bearer server-side). */
export const resumeDownloadUrl = "/api/resume/download";
