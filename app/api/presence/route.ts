import { countActive, heartbeat, leave } from "../../presence-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

export async function GET() {
  return Response.json({ active: countActive() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const id = record && typeof record.id === "string" ? record.id : null;
  const listening = record?.listening !== false;

  if (!id || !ID_RE.test(id)) {
    return Response.json({ error: "bad id" }, { status: 400 });
  }

  return Response.json({
    active: listening ? heartbeat(id) : leave(id),
  });
}
