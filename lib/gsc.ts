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
  operator?: "contains" | "equals" | "notContains" | "notEquals";
  expression: string;
}

export async function queryGsc(opts: {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: GscDimension[];
  rowLimit?: number;
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
