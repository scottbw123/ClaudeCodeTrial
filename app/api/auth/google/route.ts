import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/google-auth";
import { setOauthState } from "@/lib/session";

export async function GET() {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    await setOauthState(state);
    const url = buildAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
