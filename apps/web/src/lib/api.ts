import type { HealthResponse, StreamEvent } from "./types";

const PRIMARY =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

function fallbackUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
      return u.toString().replace(/\/$/, "");
    }
    if (u.hostname === "127.0.0.1") {
      u.hostname = "localhost";
      return u.toString().replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Fetch that retries localhost ↔ 127.0.0.1 to avoid Windows IPv6 (::1) hangs.
 */
export async function smartFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const bases = [PRIMARY];
  const alt = fallbackUrl(PRIMARY);
  if (alt && alt !== PRIMARY) bases.push(alt);

  let lastError: unknown;
  for (const base of bases) {
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);
      const merged: RequestInit = {
        ...init,
        signal: init?.signal ?? controller.signal,
      };
      const res = await fetch(url, merged);
      clearTimeout(timeout);
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to reach Ask Profile API");
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await smartFetch("/health", { method: "GET" });
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json() as Promise<HealthResponse>;
}

export async function streamChat(params: {
  message: string;
  history: { role: string; content: string }[];
  signal?: AbortSignal;
  onEvent: (event: StreamEvent) => void;
}): Promise<void> {
  const res = await smartFetch("/chat/stream", {
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

export { PRIMARY as apiBaseUrl };
