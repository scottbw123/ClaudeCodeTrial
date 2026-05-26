import type { NotionPage, NotionProperty } from "./client";

/**
 * Typed readers for Notion property values. Notion returns a tagged union per
 * property type; these narrow it safely and return null when absent.
 */

function prop(page: NotionPage, name: string): NotionProperty | undefined {
  return page.properties?.[name];
}

export function readTitle(page: NotionPage, name: string): string {
  const p = prop(page, name);
  if (!p || p.type !== "title") return "";
  const arr = (p as { title?: { plain_text?: string }[] }).title ?? [];
  return arr.map((t) => t.plain_text ?? "").join("").trim();
}

export function readRichText(page: NotionPage, name: string): string {
  const p = prop(page, name);
  if (!p || p.type !== "rich_text") return "";
  const arr = (p as { rich_text?: { plain_text?: string }[] }).rich_text ?? [];
  return arr.map((t) => t.plain_text ?? "").join("").trim();
}

export function readStatus(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  if (!p || p.type !== "status") return null;
  return (p as { status?: { name?: string } | null }).status?.name ?? null;
}

export function readSelect(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  if (!p || p.type !== "select") return null;
  return (p as { select?: { name?: string } | null }).select?.name ?? null;
}

export function readMultiSelect(page: NotionPage, name: string): string[] {
  const p = prop(page, name);
  if (!p || p.type !== "multi_select") return [];
  return (p as { multi_select?: { name?: string }[] }).multi_select
    ?.map((o) => o.name ?? "")
    .filter(Boolean) as string[];
}

export function readDate(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  if (!p || p.type !== "date") return null;
  return (p as { date?: { start?: string } | null }).date?.start ?? null;
}

export function readCheckbox(page: NotionPage, name: string): boolean {
  const p = prop(page, name);
  if (!p || p.type !== "checkbox") return false;
  return Boolean((p as { checkbox?: boolean }).checkbox);
}

export function readNumber(page: NotionPage, name: string): number | null {
  const p = prop(page, name);
  if (!p) return null;
  if (p.type === "number") return (p as { number?: number | null }).number ?? null;
  if (p.type === "unique_id") {
    return (p as { unique_id?: { number?: number | null } }).unique_id?.number ?? null;
  }
  return null;
}

export function readEmail(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  if (!p || p.type !== "email") return null;
  return (p as { email?: string | null }).email ?? null;
}

export function readUrl(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  if (!p || p.type !== "url") return null;
  return (p as { url?: string | null }).url ?? null;
}

/** Returns the related page ids for a relation property. */
export function readRelationIds(page: NotionPage, name: string): string[] {
  const p = prop(page, name);
  if (!p || p.type !== "relation") return [];
  return (p as { relation?: { id: string }[] }).relation?.map((r) => r.id) ?? [];
}
