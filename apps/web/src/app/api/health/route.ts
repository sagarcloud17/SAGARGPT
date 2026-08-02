import { getUpstreamApiUrl } from "@/lib/server-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Proxies public /health (no Bearer required upstream). */
export async function GET() {
  try {
    const res = await fetch(`${getUpstreamApiUrl()}/health`, {
      method: "GET",
      cache: "no-store",
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health proxy error";
    return Response.json({ detail: message }, { status: 502 });
  }
}
