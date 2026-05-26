import crypto from "node:crypto";
import { findClientByEmail } from "@/lib/notion/data";
import type { ClientRecord } from "@/lib/notion/types";

/**
 * Credential verification seam.
 *
 * Login maps an email -> CRM client record (the source of truth for "who is a
 * client"). Password verification is deliberately pluggable because real
 * per-client credentials aren't built yet.
 *
 * PHASE 1 (now): a single shared access password via CLIENT_ACCESS_PASSWORD
 * lets a valid client email through, so the end-to-end framework works.
 *
 * NEXT: replace `verifyPassword` with a real per-client credential store
 * (hashed passwords in the "Client Dashboard" Notion DB, or an external auth
 * provider / magic links). The rest of the app doesn't change — only this
 * function.
 */

export type AuthResult =
  | { ok: true; client: ClientRecord }
  | { ok: false; reason: "unknown_client" | "bad_password" | "not_configured" };

function verifyPassword(_client: ClientRecord, password: string): boolean | "not_configured" {
  const shared = process.env.CLIENT_ACCESS_PASSWORD;
  if (!shared) return "not_configured";
  const a = Buffer.from(password);
  const b = Buffer.from(shared);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function authenticateClient(
  email: string,
  password: string,
): Promise<AuthResult> {
  const client = await findClientByEmail(email);
  if (!client) return { ok: false, reason: "unknown_client" };

  const result = verifyPassword(client, password);
  if (result === "not_configured") return { ok: false, reason: "not_configured" };
  if (!result) return { ok: false, reason: "bad_password" };

  return { ok: true, client };
}
