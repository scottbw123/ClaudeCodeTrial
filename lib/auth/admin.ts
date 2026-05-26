import crypto from "node:crypto";

/**
 * Admin gate for the private "view as client" preview area. A single
 * ADMIN_PASSWORD unlocks it — separate from CLIENT_ACCESS_PASSWORD. This is an
 * internal tool, not client-facing.
 */

export type AdminAuth = "ok" | "bad_password" | "not_configured";

export function verifyAdminPassword(password: string): AdminAuth {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return "not_configured";
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return "bad_password";
  return crypto.timingSafeEqual(a, b) ? "ok" : "bad_password";
}
