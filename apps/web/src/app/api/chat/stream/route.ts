import { proxyUpstream } from "@/lib/server-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const upstream = await proxyUpstream("/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body,
      signal: request.signal,
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return new Response(detail || `Upstream chat failed (${upstream.status})`, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    const status = message.includes("API_SECRET") ? 503 : 502;
    return Response.json({ detail: message }, { status });
  }
}
