import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/auth/admin";
import { setAdminSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const result = verifyAdminPassword(password);
  if (result === "not_configured") {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not set." }, { status: 503 });
  }
  if (result === "bad_password") {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
