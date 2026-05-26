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

/** Read the title regardless of the property's name (each DB names it differently). */
export function readTitleAuto(page: NotionPage): string {
  for (const p of Object.values(page.properties ?? {})) {
    if (p?.type === "title") {
      const arr = (p as { title?: { plain_text?: string }[] }).title ?? [];
      return arr.map((t) => t.plain_text ?? "").join("").trim();
    }
  }
  return "";
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

/**
 * Best-effort plain-text value for a property, regardless of type (formula,
 * rollup, select, status, rich_text, …). Used for fields like "Status
 * Collation" whose underlying type we don't want to hard-code.
 */
export function readPlainText(page: NotionPage, name: string): string {
  const p = prop(page, name);
  if (!p) return "";
  switch (p.type) {
    case "formula": {
      const f = (p as { formula?: { type: string; string?: string; number?: number; boolean?: boolean; date?: { start?: string } } }).formula;
      if (!f) return "";
      if (f.type === "string") return f.string ?? "";
      if (f.type === "number") return f.number != null ? String(f.number) : "";
      if (f.type === "boolean") return f.boolean != null ? String(f.boolean) : "";
      if (f.type === "date") return f.date?.start ?? "";
      return "";
    }
    case "rich_text":
      return ((p as { rich_text?: { plain_text?: string }[] }).rich_text ?? [])
        .map((t) => t.plain_text ?? "")
        .join("");
    case "title":
      return ((p as { title?: { plain_text?: string }[] }).title ?? [])
        .map((t) => t.plain_text ?? "")
        .join("");
    case "select":
      return (p as { select?: { name?: string } | null }).select?.name ?? "";
    case "status":
      return (p as { status?: { name?: string } | null }).status?.name ?? "";
    case "multi_select":
      return ((p as { multi_select?: { name?: string }[] }).multi_select ?? [])
        .map((o) => o.name ?? "")
        .join(", ");
    case "rollup": {
      const r = (p as { rollup?: { type: string; number?: number; array?: { type: string; name?: string }[] } }).rollup;
      if (!r) return "";
      if (r.type === "number") return r.number != null ? String(r.number) : "";
      if (r.type === "array") {
        return (r.array ?? [])
          .map((item) => (item as { name?: string }).name ?? "")
          .join(", ");
      }
      return "";
    }
    default:
      return "";
  }
}

/** Returns the related page ids for a relation property. */
export function readRelationIds(page: NotionPage, name: string): string[] {
  const p = prop(page, name);
  if (!p || p.type !== "relation") return [];
  return (p as { relation?: { id: string }[] }).relation?.map((r) => r.id) ?? [];
}
