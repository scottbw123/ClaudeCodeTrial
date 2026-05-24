import { google } from "googleapis";
import { getOAuth2Client } from "./google-auth";

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export type GscDimension = "query" | "page" | "date" | "country" | "device";

export async function listSites(): Promise<GscSite[]> {
  const webmasters = google.webmasters({ version: "v3", auth: getOAuth2Client() });
  const { data } = await webmasters.sites.list();
  return (data.siteEntry ?? [])
    .filter((s) => s.siteUrl && s.permissionLevel && s.permissionLevel !== "siteUnverifiedUser")
    .map((s) => ({ siteUrl: s.siteUrl!, permissionLevel: s.permissionLevel! }));
}

export interface GscFilter {
  dimension: GscDimension;
  operator?: "contains" | "equals" | "notContains" | "notEquals" | "includingRegex" | "excludingRegex";
  expression: string;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strips ?query and #fragment from a URL so different parameter variants of the
 * same canonical page roll up into a single row.
 */
export function normalizePageUrl(url: string): string {
  if (!url) return url;
  let end = url.length;
  const q = url.indexOf("?");
  const h = url.indexOf("#");
  if (q !== -1) end = Math.min(end, q);
  if (h !== -1) end = Math.min(end, h);
  return url.slice(0, end);
}

export function mergePageRowsByNormalizedUrl(rows: GscRow[]): GscRow[] {
  const grouped = new Map<string, GscRow>();
  for (const r of rows) {
    const norm = normalizePageUrl(r.keys[0] ?? "");
    const existing = grouped.get(norm);
    if (!existing) {
      grouped.set(norm, { keys: [norm], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
    } else {
      const oldImps = existing.impressions;
      const newImps = r.impressions;
      const totalImps = oldImps + newImps;
      existing.clicks += r.clicks;
      existing.impressions = totalImps;
      existing.position = totalImps > 0 ? (existing.position * oldImps + r.position * newImps) / totalImps : 0;
      existing.ctr = totalImps > 0 ? existing.clicks / totalImps : 0;
    }
  }
  return Array.from(grouped.values()).sort((a, b) => b.impressions - a.impressions);
}

export async function queryGsc(opts: {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: GscDimension[];
  rowLimit?: number;
  startRow?: number;
  filters?: GscFilter[];
}): Promise<GscRow[]> {
  const webmasters = google.webmasters({ version: "v3", auth: getOAuth2Client() });
  const { data } = await webmasters.searchanalytics.query({
    siteUrl: opts.siteUrl,
    requestBody: {
      startDate: opts.startDate,
      endDate: opts.endDate,
      dimensions: opts.dimensions,
      rowLimit: opts.rowLimit ?? 1000,
      startRow: opts.startRow ?? 0,
      dimensionFilterGroups: opts.filters?.length
        ? [
            {
              filters: opts.filters.map((f) => ({
                dimension: f.dimension,
                operator: f.operator ?? "equals",
                expression: f.expression,
              })),
            },
          ]
        : undefined,
    },
  });
  return (data.rows ?? []).map((r) => ({
    keys: r.keys ?? [],
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

const GSC_MAX_ROWS_PER_REQUEST = 25000;
const FILTER_BATCH_SIZE = 80;

function buildRegexFilter(dimension: GscDimension, values: string[]): GscFilter | null {
  if (values.length === 0) return null;
  if (values.length === 1) {
    return { dimension, operator: "includingRegex", expression: escapeRegex(values[0]) };
  }
  const escaped = values.map(escapeRegex).join("|");
  return { dimension, operator: "includingRegex", expression: `(${escaped})` };
}

function mergeRows(rows: GscRow[]): GscRow[] {
  const grouped = new Map<string, GscRow>();
  for (const r of rows) {
    const key = r.keys.join("\x00");
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { keys: [...r.keys], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
    } else {
      const oldImps = existing.impressions;
      const newImps = r.impressions;
      const totalImps = oldImps + newImps;
      existing.clicks += r.clicks;
      existing.impressions = totalImps;
      existing.position = totalImps > 0
        ? (existing.position * oldImps + r.position * newImps) / totalImps
        : 0;
      existing.ctr = totalImps > 0 ? existing.clicks / totalImps : 0;
    }
  }
  return Array.from(grouped.values()).sort((a, b) => b.impressions - a.impressions);
}

export type FilterMode = "include" | "exclude";

function buildExcludeFilters(dimension: GscDimension, values: string[]): GscFilter[] {
  if (values.length === 0) return [];
  const out: GscFilter[] = [];
  for (let i = 0; i < values.length; i += FILTER_BATCH_SIZE) {
    const batch = values.slice(i, i + FILTER_BATCH_SIZE);
    const escaped = batch.map(escapeRegex).join("|");
    out.push({ dimension, operator: "excludingRegex", expression: `(${escaped})` });
  }
  return out;
}

export async function queryGscFiltered(opts: {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: GscDimension[];
  rowLimit?: number;
  filterQueries?: string[];
  filterQueriesExclude?: string[];
  filterPages?: string[];
  filterPagesExclude?: string[];
  // Back-compat with the older mode-based API.
  filterQueriesMode?: FilterMode;
  filterPagesMode?: FilterMode;
}): Promise<GscRow[]> {
  // Resolve back-compat mode → split into include/exclude
  let queryInc = opts.filterQueries ?? [];
  let queryExc = opts.filterQueriesExclude ?? [];
  let pageInc = opts.filterPages ?? [];
  let pageExc = opts.filterPagesExclude ?? [];
  if (opts.filterQueriesMode === "exclude" && queryInc.length > 0 && queryExc.length === 0) {
    queryExc = queryInc;
    queryInc = [];
  }
  if (opts.filterPagesMode === "exclude" && pageInc.length > 0 && pageExc.length === 0) {
    pageExc = pageInc;
    pageInc = [];
  }

  const excludeFilters = [
    ...buildExcludeFilters("query", queryExc),
    ...buildExcludeFilters("page", pageExc),
  ];

  const filters: GscFilter[] = [...excludeFilters];
  const q = buildRegexFilter("query", queryInc);
  if (q) filters.push(q);
  const p = buildRegexFilter("page", pageInc);
  if (p) filters.push(p);

  return queryGsc({
    siteUrl: opts.siteUrl,
    startDate: opts.startDate,
    endDate: opts.endDate,
    dimensions: opts.dimensions,
    rowLimit: opts.rowLimit,
    filters,
  });
}

export async function queryGscPaginated(
  opts: Omit<Parameters<typeof queryGsc>[0], "rowLimit" | "startRow">,
  maxRows: number
): Promise<GscRow[]> {
  const pages = Math.ceil(maxRows / GSC_MAX_ROWS_PER_REQUEST);
  const promises: Promise<GscRow[]>[] = [];
  for (let i = 0; i < pages; i++) {
    const remaining = maxRows - i * GSC_MAX_ROWS_PER_REQUEST;
    promises.push(
      queryGsc({
        ...opts,
        rowLimit: Math.min(GSC_MAX_ROWS_PER_REQUEST, remaining),
        startRow: i * GSC_MAX_ROWS_PER_REQUEST,
      })
    );
  }
  const results = await Promise.all(promises);
  return results.flat();
}
