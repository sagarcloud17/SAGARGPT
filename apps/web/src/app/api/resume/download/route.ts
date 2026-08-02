import { proxyUpstream } from "@/lib/server-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const upstream = await proxyUpstream("/resume/download", {
      method: "GET",
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return new Response(detail || `Resume download failed (${upstream.status})`, {
        status: upstream.status,
      });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("Content-Type") || "application/pdf",
    );
    const disposition = upstream.headers.get("Content-Disposition");
    headers.set(
      "Content-Disposition",
      disposition || 'inline; filename="resume.pdf"',
    );
    headers.set("Cache-Control", "private, max-age=300");

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    const status = message.includes("API_SECRET") ? 503 : 502;
    return Response.json({ detail: message }, { status });
  }
}
