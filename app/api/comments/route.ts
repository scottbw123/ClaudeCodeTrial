import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Client-facing comments seam.
 *
 * This is a SEPARATE channel from internal Notion comment threads — clients
 * must never see internal discussion. When implemented, store/read these in a
 * dedicated client-visible store (e.g. the "Client Feedback (Softr)" DB at
 * 35a366b4-3c25-8004-8a93-000ba3d9009f, or a purpose-built comments DB), keyed
 * by task id and always filtered to session.clientId.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const taskId = new URL(request.url).searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required." }, { status: 400 });
  }
  // Placeholder until the client-comment store is wired.
  return NextResponse.json({ comments: [] });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { taskId?: unknown; text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.taskId !== "string" || typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "taskId and text are required." }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Client comments store not yet wired. See route comment for the intended design." },
    { status: 501 },
  );
}
