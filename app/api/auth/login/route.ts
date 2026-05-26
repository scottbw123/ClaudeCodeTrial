import { NextResponse } from "next/server";
import { authenticateClient } from "@/lib/auth/clientAuth";
import { setSession } from "@/lib/auth/session";

const REASON_MESSAGES: Record<string, string> = {
  unknown_client: "No client account found for that email.",
  bad_password: "Incorrect password.",
  not_configured:
    "Client login isn't fully configured yet (set CLIENT_ACCESS_PASSWORD or wire a credential store).",
};

export async function POST(request: Request) {
  let email: unknown;
  let password: unknown;
  try {
    ({ email, password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  let result;
  try {
    result = await authenticateClient(email, password);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!result.ok) {
    const status = result.reason === "not_configured" ? 503 : 401;
    return NextResponse.json({ error: REASON_MESSAGES[result.reason] }, { status });
  }

  await setSession({
    clientId: result.client.id,
    email: result.client.email ?? email,
    name: result.client.name,
  });

  return NextResponse.json({ ok: true });
}
