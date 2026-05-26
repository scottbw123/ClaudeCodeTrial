import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Approval / feedback submission seam.
 *
 * Intentionally NOT implemented yet: the team wants a specific approval
 * mechanism (it is NOT just "set status = Approved"). This handler establishes
 * the authenticated, client-scoped contract; the actual Notion write lands once
 * the workflow is defined.
 *
 * Expected contract (subject to refinement):
 *   POST { taskId: string, decision: "approve" | "request_changes", note?: string }
 *   - verify the task's CRM relation === session.clientId before any write
 *   - apply the agreed transition (e.g. set Softr Approval / Softr Feedback,
 *     advance Product Status ⚡, write a changelog entry)
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { taskId?: unknown; decision?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.taskId !== "string" || (body.decision !== "approve" && body.decision !== "request_changes")) {
    return NextResponse.json(
      { error: "taskId and a valid decision are required." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error:
        "Approval workflow not yet wired. Define the exact transition (status / fields to update) and implement it here.",
    },
    { status: 501 },
  );
}
