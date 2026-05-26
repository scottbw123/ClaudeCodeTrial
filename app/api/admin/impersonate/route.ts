import { NextResponse } from "next/server";
import { getAdminSession, setSession } from "@/lib/auth/session";
import { getClientById } from "@/lib/notion/data";

/**
 * Admin-only: start a client-preview session ("view as client"). Requires a
 * valid admin session; sets a normal client session flagged admin: true so the
 * existing dashboard renders exactly what the client would see.
 */
export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  }

  let clientId: unknown;
  try {
    ({ clientId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof clientId !== "string" || !clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  const client = await getClientById(clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  await setSession({
    clientId: client.id,
    email: client.email ?? "",
    name: client.name,
    admin: true,
  });

  return NextResponse.json({ ok: true });
}
