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
  if (values.length === 1) return { dimension, operator: "equals", expression: values[0] };
  const escaped = values.map(escapeRegex).join("|");
  return { dimension, operator: "includingRegex", expression: `^(${escaped})$` };
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

export async function queryGscFiltered(opts: {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: GscDimension[];
  rowLimit?: number;
  filterQueries?: string[];
  filterPages?: string[];
}): Promise<GscRow[]> {
  const queries = opts.filterQueries ?? [];
  const pages = opts.filterPages ?? [];

  if (queries.length <= FILTER_BATCH_SIZE && pages.length <= FILTER_BATCH_SIZE) {
    const filters: GscFilter[] = [];
    const q = buildRegexFilter("query", queries);
    if (q) filters.push(q);
    const p = buildRegexFilter("page", pages);
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

  const batchDim: GscDimension = queries.length >= pages.length ? "query" : "page";
  const batchValues = batchDim === "query" ? queries : pages;
  const otherDim: GscDimension = batchDim === "query" ? "page" : "query";
  const otherValues = batchDim === "query" ? pages : queries;

  const batches: string[][] = [];
  for (let i = 0; i < batchValues.length; i += FILTER_BATCH_SIZE) {
    batches.push(batchValues.slice(i, i + FILTER_BATCH_SIZE));
  }

  const promises = batches.map((batch) => {
    const filters: GscFilter[] = [];
    const bf = buildRegexFilter(batchDim, batch);
    if (bf) filters.push(bf);
    const of = buildRegexFilter(otherDim, otherValues);
    if (of) filters.push(of);
    return queryGsc({
      siteUrl: opts.siteUrl,
      startDate: opts.startDate,
      endDate: opts.endDate,
      dimensions: opts.dimensions,
      rowLimit: opts.rowLimit,
      filters,
    });
  });

  const results = await Promise.all(promises);
  return mergeRows(results.flat());
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
