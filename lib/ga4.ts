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

export interface Ga4Filter {
  fieldName: string;
  matchType?: "EXACT" | "CONTAINS" | "BEGINS_WITH" | "FULL_REGEXP" | "PARTIAL_REGEXP";
  value?: string;
  values?: string[];
  negate?: boolean;
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

function singleFilterExpression(f: Ga4Filter) {
  let core;
  if (f.values && f.values.length > 0) {
    core = {
      filter: {
        fieldName: f.fieldName,
        inListFilter: { values: f.values },
      },
    };
  } else {
    core = {
      filter: {
        fieldName: f.fieldName,
        stringFilter: { matchType: f.matchType ?? "EXACT", value: f.value ?? "" },
      },
    };
  }
  return f.negate ? { notExpression: core } : core;
}

function buildDimensionFilter(filters: Ga4Filter[]) {
  if (filters.length === 0) return undefined;
  if (filters.length === 1) return singleFilterExpression(filters[0]);
  return {
    andGroup: {
      expressions: filters.map(singleFilterExpression),
    },
  };
}

export async function runReport(opts: {
  propertyId: string;
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  limit?: number;
  orderByMetric?: { name: string; desc?: boolean };
  filters?: Ga4Filter[];
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
      dimensionFilter: opts.filters && opts.filters.length > 0 ? buildDimensionFilter(opts.filters) : undefined,
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
