import { google } from "googleapis";
import { getOAuth2Client } from "./google-auth";

export interface Ga4Property {
  accountId: string;
  accountName: string;
  propertyId: string;
  propertyName: string;
}

export interface Ga4Row {
  dimensionValues: string[];
  metricValues: string[];
}

export interface Ga4ReportResult {
  rows: Ga4Row[];
  totals: string[];
}

export async function listProperties(): Promise<Ga4Property[]> {
  const admin = google.analyticsadmin({ version: "v1beta", auth: getOAuth2Client() });
  const { data } = await admin.accountSummaries.list({ pageSize: 200 });
  const out: Ga4Property[] = [];
  for (const acct of data.accountSummaries ?? []) {
    for (const prop of acct.propertySummaries ?? []) {
      out.push({
        accountId: (acct.account ?? "").replace(/^accounts\//, ""),
        accountName: acct.displayName ?? "",
        propertyId: (prop.property ?? "").replace(/^properties\//, ""),
        propertyName: prop.displayName ?? "",
      });
    }
  }
  return out;
}

export async function runReport(opts: {
  propertyId: string;
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  limit?: number;
  orderByMetric?: { name: string; desc?: boolean };
}): Promise<Ga4ReportResult> {
  const data = google.analyticsdata({ version: "v1beta", auth: getOAuth2Client() });
  const { data: resp } = await data.properties.runReport({
    property: `properties/${opts.propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: opts.startDate, endDate: opts.endDate }],
      dimensions: opts.dimensions.map((name) => ({ name })),
      metrics: opts.metrics.map((name) => ({ name })),
      limit: opts.limit ? String(opts.limit) : "1000",
      orderBys: opts.orderByMetric
        ? [{ metric: { metricName: opts.orderByMetric.name }, desc: opts.orderByMetric.desc ?? true }]
        : undefined,
      metricAggregations: ["TOTAL"],
    },
  });
  return {
    rows: (resp.rows ?? []).map((r) => ({
      dimensionValues: (r.dimensionValues ?? []).map((d) => d.value ?? ""),
      metricValues: (r.metricValues ?? []).map((m) => m.value ?? ""),
    })),
    totals: ((resp.totals ?? [])[0]?.metricValues ?? []).map((m) => m.value ?? ""),
  };
}
