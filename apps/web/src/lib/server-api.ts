/** Server-only helpers for calling the FastAPI backend with Bearer auth. */

const trimSlash = (url: string) => url.replace(/\/$/, "");

/** Upstream FastAPI base URL (never expose API_SECRET to the browser). */
export function getUpstreamApiUrl(): string {
  const url =
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:8000";
  return trimSlash(url);
}

export function getApiSecret(): string {
  const secret = process.env.API_SECRET?.trim() || "";
  if (!secret) {
    throw new Error("API_SECRET is not configured on the web server");
  }
  return secret;
}

export function bearerHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${getApiSecret()}`);
  return headers;
}

export async function proxyUpstream(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${getUpstreamApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = bearerHeaders(init?.headers);
  return fetch(url, { ...init, headers, cache: "no-store" });
}
