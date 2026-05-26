import { NextResponse } from "next/server";
import { clearAdminSession, clearSession } from "@/lib/auth/session";

export async function POST() {
  // Clear both the admin gate and any active client-preview session.
  await Promise.all([clearAdminSession(), clearSession()]);
  return NextResponse.json({ ok: true });
}
