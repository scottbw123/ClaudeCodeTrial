import { cookies } from "next/headers";
import crypto from "node:crypto";

/**
 * Stateless, signed-cookie sessions. Two cookies:
 *  - client session (of_session): the authenticated client's CRM page id; all
 *    Notion reads are scoped to it. May carry `admin: true` when an admin is
 *    previewing ("view as client").
 *  - admin session (of_admin): unlocks the private /admin preview area.
 *
 * Both are HMAC-signed (tamper-proof) and httpOnly (invisible to client JS).
 */

const CLIENT_COOKIE = "of_session";
const ADMIN_COOKIE = "of_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  clientId: string; // Notion CRM page id
  email: string;
  name: string;
  admin?: boolean; // true when an admin is previewing this client
  exp: number; // epoch seconds
}

export interface AdminSession {
  exp: number;
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }
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

function signToken(payload: object): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function verifyToken<T extends { exp: number }>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!timingSafeEqual(sig, sign(body))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    if (!data.exp || data.exp * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

// --- Client session ---

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifyToken<Session>(store.get(CLIENT_COOKIE)?.value);
}

export async function setSession(data: Omit<Session, "exp">): Promise<void> {
  const session: Session = { ...data, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const store = await cookies();
  store.set(CLIENT_COOKIE, signToken(session), cookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(CLIENT_COOKIE);
}

// --- Admin session (gates the /admin preview area) ---

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifyToken<AdminSession>(store.get(ADMIN_COOKIE)?.value);
}

export async function setAdminSession(): Promise<void> {
  const session: AdminSession = { exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const store = await cookies();
  store.set(ADMIN_COOKIE, signToken(session), cookieOptions());
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
