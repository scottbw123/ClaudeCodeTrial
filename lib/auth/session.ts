import { cookies } from "next/headers";
import crypto from "node:crypto";

/**
 * Stateless, signed-cookie sessions. The cookie carries the authenticated
 * client's CRM page id; all Notion reads are scoped to it server-side. The
 * cookie is HMAC-signed so it can't be tampered with, httpOnly so client JS
 * can't read it.
 */

const COOKIE_NAME = "of_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  clientId: string; // Notion CRM page id
  email: string;
  name: string;
  exp: number; // epoch seconds
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }
  // Dev-only fallback so the framework runs before secrets are provisioned.
  return "dev-insecure-session-secret-change-me";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function serializeSession(session: Session): string {
  const payload = b64url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function parseSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!timingSafeEqual(sig, sign(payload))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!session.exp || session.exp * 1000 < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return parseSession(store.get(COOKIE_NAME)?.value);
}

export async function setSession(data: Omit<Session, "exp">): Promise<void> {
  const session: Session = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const store = await cookies();
  store.set(COOKIE_NAME, serializeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
