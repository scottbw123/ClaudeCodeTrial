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
  fieldName?: string;
  matchType?: "EXACT" | "CONTAINS" | "BEGINS_WITH" | "FULL_REGEXP" | "PARTIAL_REGEXP";
  value?: string;
  values?: string[];
  negate?: boolean;
  // OR across groups of AND'd sub-filters, e.g. match (hostA AND pathA) OR (hostB AND pathB).
  or?: Ga4Filter[][];
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

interface FilterExpr {
  filter?: {
    fieldName?: string;
    stringFilter?: { matchType: string; value: string };
    inListFilter?: { values: string[] };
  };
  andGroup?: { expressions: FilterExpr[] };
  orGroup?: { expressions: FilterExpr[] };
  notExpression?: FilterExpr;
}

function singleFilterExpression(f: Ga4Filter): FilterExpr {
  let core: FilterExpr;
  if (f.or && f.or.length > 0) {
    const expressions: FilterExpr[] = f.or.map((group) =>
      group.length === 1
        ? singleFilterExpression(group[0])
        : { andGroup: { expressions: group.map(singleFilterExpression) } }
    );
    // Always wrap in orGroup (even for a single group) so the result is never an
    // andGroup nested directly inside another andGroup, which GA4 can silently drop.
    core = { orGroup: { expressions } };
  } else if (f.values && f.values.length > 0) {
    if (f.matchType && f.matchType !== "EXACT") {
      // OR a substring/regex match across each value (e.g. CONTAINS any of …).
      const matchType = f.matchType;
      const expressions: FilterExpr[] = f.values.map((v) => ({
        filter: { fieldName: f.fieldName, stringFilter: { matchType, value: v } },
      }));
      core = expressions.length === 1 ? expressions[0] : { orGroup: { expressions } };
    } else {
      core = {
        filter: {
          fieldName: f.fieldName,
          inListFilter: { values: f.values },
        },
      };
    }
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

/**
 * Fan out a report across multiple properties and merge rows by dimension key.
 * Metrics are summed naively — accurate for counts (sessions, users, events),
 * approximate for rate metrics (bounce rate, etc.) when more than one property
 * is selected. For single-property selection this behaves identically to runReport.
 */
export async function runReportMultiProperty(opts: {
  propertyIds: string[];
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  limit?: number;
  orderByMetric?: { name: string; desc?: boolean };
  filters?: Ga4Filter[];
}): Promise<Ga4ReportResult> {
  if (opts.propertyIds.length === 0) return { rows: [], totals: [] };
  const { propertyIds, ...rest } = opts;
  if (propertyIds.length === 1) {
    return runReport({ propertyId: propertyIds[0], ...rest });
  }
  const results = await Promise.all(
    propertyIds.map((propertyId) => runReport({ propertyId, ...rest }))
  );
  const grouped = new Map<string, Ga4Row>();
  for (const r of results) {
    for (const row of r.rows) {
      const key = row.dimensionValues.join("\x00");
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          dimensionValues: [...row.dimensionValues],
          metricValues: [...row.metricValues],
        });
      } else {
        for (let i = 0; i < row.metricValues.length; i++) {
          existing.metricValues[i] = String(
            Number(existing.metricValues[i] ?? 0) + Number(row.metricValues[i] ?? 0)
          );
        }
      }
    }
  }
  const merged = Array.from(grouped.values()).sort(
    (a, b) => Number(b.metricValues[0] ?? 0) - Number(a.metricValues[0] ?? 0)
  );
  const totals: string[] = [];
  for (const r of results) {
    for (let i = 0; i < r.totals.length; i++) {
      totals[i] = String(Number(totals[i] ?? 0) + Number(r.totals[i] ?? 0));
    }
  }
  return { rows: merged, totals };
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
