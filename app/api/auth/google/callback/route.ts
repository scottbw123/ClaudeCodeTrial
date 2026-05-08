import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchUserEmail } from "@/lib/google-auth";
import { consumeOauthState, setSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const home = new URL("/", url.origin);

  if (error) {
    home.searchParams.set("auth_error", error);
    return NextResponse.redirect(home);
  }
  if (!code || !state) {
    home.searchParams.set("auth_error", "missing_code");
    return NextResponse.redirect(home);
  }

  const expectedState = await consumeOauthState();
  if (!expectedState || expectedState !== state) {
    home.searchParams.set("auth_error", "state_mismatch");
    return NextResponse.redirect(home);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Google only returns refresh_token on the first consent. We force prompt=consent
      // in buildAuthUrl, so this should reliably arrive.
      home.searchParams.set("auth_error", "missing_refresh_token");
      return NextResponse.redirect(home);
    }
    const email = await fetchUserEmail(tokens.access_token);
    await setSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      email,
    });
    return NextResponse.redirect(home);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    home.searchParams.set("auth_error", encodeURIComponent(message));
    return NextResponse.redirect(home);
  }
}
