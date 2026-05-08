import { googleFetch } from "./google-auth";

const GSC_BASE = "https://searchconsole.googleapis.com/webmasters/v3";

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

export async function listSites(): Promise<GscSite[]> {
  const res = await googleFetch(`${GSC_BASE}/sites`);
  if (!res.ok) {
    throw new Error(`GSC sites list failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { siteEntry?: GscSite[] };
  return data.siteEntry ?? [];
}

export interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsRequest {
  siteUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions: Array<"page" | "query" | "country" | "device" | "date">;
  rowLimit?: number;
  startRow?: number;
  dimensionFilterGroups?: Array<{
    filters: Array<{
      dimension: "page" | "query" | "country" | "device";
      operator: "equals" | "contains" | "notContains" | "notEquals" | "includingRegex" | "excludingRegex";
      expression: string;
    }>;
  }>;
}

export async function searchAnalytics(req: SearchAnalyticsRequest): Promise<GscRow[]> {
  const url = `${GSC_BASE}/sites/${encodeURIComponent(req.siteUrl)}/searchAnalytics/query`;
  const allRows: GscRow[] = [];
  const pageSize = Math.min(req.rowLimit ?? 25000, 25000);
  let startRow = req.startRow ?? 0;

  while (true) {
    const res = await googleFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: req.startDate,
        endDate: req.endDate,
        dimensions: req.dimensions,
        rowLimit: pageSize,
        startRow,
        dimensionFilterGroups: req.dimensionFilterGroups,
      }),
    });

    if (!res.ok) {
      throw new Error(`GSC searchAnalytics failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as { rows?: GscRow[] };
    const rows = data.rows ?? [];
    allRows.push(...rows);

    // Stop if we got a partial page (no more data) or hit the user's overall limit
    if (rows.length < pageSize) break;
    startRow += pageSize;
    if (req.rowLimit && allRows.length >= req.rowLimit) break;
    // Safety cap: don't loop forever
    if (startRow > 200_000) break;
  }
  return allRows;
}

export interface PageMetrics {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function rowsToPageMetrics(rows: GscRow[]): Map<string, PageMetrics> {
  const map = new Map<string, PageMetrics>();
  for (const row of rows) {
    const page = row.keys[0];
    if (!page) continue;
    map.set(page, {
      page,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    });
  }
  return map;
}

export interface PageComparison {
  page: string;
  current: PageMetrics;
  previous: PageMetrics;
  positionDelta: number; // current - previous (positive = ranking dropped)
  impressionsDelta: number;
  clicksDelta: number;
  topQuery?: string;
  topQueryImpressions?: number;
  topQueryPosition?: number;
}

/**
 * For each page in `currentByPage`, return a comparison vs `previousByPage`.
 * Pages that don't exist in the previous period are skipped (no baseline).
 */
export function buildComparisons(
  currentByPage: Map<string, PageMetrics>,
  previousByPage: Map<string, PageMetrics>,
): PageComparison[] {
  const out: PageComparison[] = [];
  for (const [page, current] of currentByPage) {
    const previous = previousByPage.get(page);
    if (!previous) continue;
    out.push({
      page,
      current,
      previous,
      positionDelta: current.position - previous.position,
      impressionsDelta: current.impressions - previous.impressions,
      clicksDelta: current.clicks - previous.clicks,
    });
  }
  return out;
}

/**
 * Filter and rank pages whose rankings have dropped.
 *  - `positionDeltaMin`: page must be at least this many positions worse (default 1)
 *  - `minPreviousImpressions`: page must have had this many impressions previously (default 10)
 *
 * Sorted by impact = previous.impressions * positionDelta, descending.
 */
export function rankDecliningPages(
  comparisons: PageComparison[],
  options: { positionDeltaMin?: number; minPreviousImpressions?: number } = {},
): PageComparison[] {
  const positionDeltaMin = options.positionDeltaMin ?? 1;
  const minPreviousImpressions = options.minPreviousImpressions ?? 10;
  return comparisons
    .filter(
      (c) =>
        c.positionDelta >= positionDeltaMin &&
        c.previous.impressions >= minPreviousImpressions,
    )
    .sort(
      (a, b) =>
        b.previous.impressions * b.positionDelta -
        a.previous.impressions * a.positionDelta,
    );
}

/**
 * Attach the top query (by impressions in the current period) for a given page.
 */
export async function attachTopQueries(
  siteUrl: string,
  startDate: string,
  endDate: string,
  comparisons: PageComparison[],
  concurrency = 4,
): Promise<void> {
  const queue = [...comparisons];
  const workers: Promise<void>[] = [];

  for (let i = 0; i < concurrency; i++) {
    workers.push(
      (async () => {
        while (queue.length) {
          const c = queue.shift();
          if (!c) return;
          try {
            const rows = await searchAnalytics({
              siteUrl,
              startDate,
              endDate,
              dimensions: ["query"],
              rowLimit: 5,
              dimensionFilterGroups: [
                {
                  filters: [{ dimension: "page", operator: "equals", expression: c.page }],
                },
              ],
            });
            const top = rows.sort((a, b) => b.impressions - a.impressions)[0];
            if (top) {
              c.topQuery = top.keys[0];
              c.topQueryImpressions = top.impressions;
              c.topQueryPosition = top.position;
            }
          } catch {
            // Ignore individual failures; the row just won't have a top query.
          }
        }
      })(),
    );
  }

  await Promise.all(workers);
}
