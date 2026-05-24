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
