import { listProperties, runReportMultiProperty, type Ga4Filter, type Ga4Row } from "@/lib/ga4";
import { normalizePageUrl, escapeRegex } from "@/lib/gsc";
import { previousPeriod, rangeFromDays, daysBetween } from "@/lib/date-utils";
import { AI_SOURCES } from "@/lib/ai-sources";
import { PresentationHeader } from "../components/Header";
import { PresentationFooter } from "../components/Footer";
import { UrlCell } from "../components/UrlCell";
import { TableExport } from "../components/TableExport";
import { AiControls } from "./Controls";

// Filtering matches on the session-scoped landing path. Options/chips carry the
// full https://host/path URL for display, so strip the scheme + host back to the
// path before matching; free-typed substrings (no scheme) pass through as-is.
function pathOf(v: string): string {
  const m = v.match(/^https?:\/\/[^/]+(\/.*)?$/i);
  return m ? (m[1] ?? "/") : v;
}

// Pages come back as [hostName, landingPagePlusQueryString]; stitch them into a
// full URL so the table shows the entire address, not just the path.
function fullUrlPagesGa4(rows: Ga4Row[]): Ga4Row[] {
  const grouped = new Map<string, Ga4Row>();
  for (const r of rows) {
    const host = r.dimensionValues[0] ?? "";
    const path = r.dimensionValues[1] ?? "";
    const url = host ? `https://${host}${path}` : path;
    const existing = grouped.get(url);
    if (!existing) {
      grouped.set(url, { dimensionValues: [url], metricValues: [...r.metricValues] });
    } else {
      for (let i = 0; i < r.metricValues.length; i++) {
        existing.metricValues[i] = String(Number(existing.metricValues[i] ?? 0) + Number(r.metricValues[i] ?? 0));
      }
    }
  }
  return Array.from(grouped.values()).sort((a, b) =>
    Number(b.metricValues[0] ?? 0) - Number(a.metricValues[0] ?? 0)
  );
}
import {
  SessionsLineChart,
  TopSourcesDonut,
  StackedBarBySource,
  StackedBarByEvent,
  StatCard,
} from "./AiSections";

interface Props {
  searchParams: Record<string, string | undefined>;
  overviewHref: string;
  gscHref: string;
  ga4Href: string;
  aiHref: string;
  posthogHref: string;
}

function pct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 1;
  return (current - previous) / previous;
}

function formatBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec.toString().padStart(2, "0")}s`;
}

function formatGa4Date(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function weekOf(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

interface SiteMetrics {
  users: number;
  bounceRate: number;
  screenPageViewsPerSession: number;
  averageSessionDuration: number;
  keyEventRate: number;
}

function toMetrics(values: string[]): SiteMetrics {
  const users = Number(values[0] ?? 0);
  const keyEvents = Number(values[4] ?? 0);
  return {
    users,
    bounceRate: Number(values[1] ?? 0),
    screenPageViewsPerSession: Number(values[2] ?? 0),
    averageSessionDuration: Number(values[3] ?? 0),
    keyEventRate: users > 0 ? keyEvents / users : 0,
  };
}

async function fetchSiteMetrics(propertyIds: string[], startDate: string, endDate: string, filters: Ga4Filter[]): Promise<SiteMetrics> {
  const r = await runReportMultiProperty({
    propertyIds,
    startDate,
    endDate,
    dimensions: [],
    metrics: ["activeUsers", "bounceRate", "screenPageViewsPerSession", "averageSessionDuration", "keyEvents"],
    filters,
  });
  return toMetrics(r.totals);
}

export async function AiContent({ searchParams: sp, overviewHref, gscHref, ga4Href, aiHref, posthogHref }: Props) {
  const properties = await listProperties();
  const propertyIds = (sp.propertyId || properties[0]?.propertyId || "").split(",").map((s) => s.trim()).filter(Boolean);

  const hasCustom = Boolean(sp.start && sp.end);
  const days = Number(sp.days || 30);
  const range = hasCustom ? { startDate: sp.start!, endDate: sp.end! } : rangeFromDays(days);
  const computedDays = daysBetween(range.startDate, range.endDate);
  const compareRange = previousPeriod(range.startDate, range.endDate);

  const pageUrls = (sp.pageUrl || "").split(",").map((s) => s.trim()).filter(Boolean);
  const pageUrlsExclude = (sp.pageUrlExclude || "").split(",").map((s) => s.trim()).filter(Boolean);
  const eventNames = (sp.eventName || "").split(",").map((s) => s.trim()).filter(Boolean);

  const aiFilter: Ga4Filter = { fieldName: "sessionSource", values: AI_SOURCES };
  const baseFilters: Ga4Filter[] = [aiFilter];
  const includePaths = pageUrls.map(pathOf);
  const excludePaths = pageUrlsExclude.map(pathOf);
  if (includePaths.length > 0) baseFilters.push({ fieldName: "landingPagePlusQueryString", matchType: "CONTAINS", values: includePaths });
  // Use PARTIAL_REGEXP for negated matches — GA4's notExpression(stringFilter CONTAINS)
  // is unreliable on some properties; PARTIAL_REGEXP behaves the same (substring) but
  // goes through the regex engine, which honors notExpression consistently.
  if (excludePaths.length > 0) baseFilters.push({ fieldName: "landingPagePlusQueryString", matchType: "PARTIAL_REGEXP", values: excludePaths.map(escapeRegex), negate: true });
  if (eventNames.length === 1) baseFilters.push({ fieldName: "eventName", value: eventNames[0] });
  else if (eventNames.length > 1) baseFilters.push({ fieldName: "eventName", values: eventNames });

  let fetchError: string | null = null;
  let dailySessions: { date: string; value: number }[] = [];
  let topSources: { name: string; value: number }[] = [];
  let totalAiSessions = 0;
  let prevTotalAiSessions = 0;
  let pagesRows: Ga4Row[] = [];
  let prevPagesByPath = new Map<string, Ga4Row>();
  let sourceWeeklyRows: Ga4Row[] = [];
  let trafficSourceRows: Ga4Row[] = [];
  let aiMetrics: SiteMetrics = { users: 0, bounceRate: 0, screenPageViewsPerSession: 0, averageSessionDuration: 0, keyEventRate: 0 };
  let prevAiMetrics: SiteMetrics = { users: 0, bounceRate: 0, screenPageViewsPerSession: 0, averageSessionDuration: 0, keyEventRate: 0 };
  let totalSiteMetrics: SiteMetrics = { users: 0, bounceRate: 0, screenPageViewsPerSession: 0, averageSessionDuration: 0, keyEventRate: 0 };
  let prevTotalSiteMetrics: SiteMetrics = { users: 0, bounceRate: 0, screenPageViewsPerSession: 0, averageSessionDuration: 0, keyEventRate: 0 };
  let eventsRows: Ga4Row[] = [];
  let prevEventsByName = new Map<string, Ga4Row>();
  let eventsWeeklyRows: Ga4Row[] = [];
  let pageOptions: string[] = [];
  let eventOptions: string[] = [];

  if (propertyIds.length > 0) {
    try {
      const [
        sessionsTs,
        prevSessionsTs,
        topSourcesRows,
        pagesCurrent,
        pagesPrev,
        sourceByDate,
        trafficSrc,
        aiTotals,
        aiPrevTotals,
        totalTotals,
        totalPrevTotals,
        eventsCurrent,
        eventsPrev,
        eventsByDate,
        pageOpts,
        eventOpts,
      ] = await Promise.all([
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["date"],
          metrics: ["sessions"],
          limit: 500,
          filters: baseFilters,
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: compareRange.startDate,
          endDate: compareRange.endDate,
          dimensions: ["date"],
          metrics: ["sessions"],
          limit: 500,
          filters: baseFilters,
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["sessionSource"],
          metrics: ["sessions"],
          limit: 20,
          orderByMetric: { name: "sessions" },
          filters: baseFilters,
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["hostName", "landingPagePlusQueryString"],
          metrics: ["sessions", "eventCount"],
          limit: 50,
          orderByMetric: { name: "sessions" },
          filters: baseFilters,
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: compareRange.startDate,
          endDate: compareRange.endDate,
          dimensions: ["hostName", "landingPagePlusQueryString"],
          metrics: ["sessions", "eventCount"],
          limit: 500,
          filters: baseFilters,
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["date", "sessionSource"],
          metrics: ["sessions"],
          limit: 5000,
          filters: baseFilters,
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["sessionSourceMedium"],
          metrics: ["activeUsers", "newUsers", "engagementRate", "screenPageViewsPerSession", "averageSessionDuration", "keyEvents", "eventCount"],
          limit: 50,
          orderByMetric: { name: "activeUsers" },
          filters: baseFilters,
        }),
        fetchSiteMetrics(propertyIds, range.startDate, range.endDate, baseFilters),
        fetchSiteMetrics(propertyIds, compareRange.startDate, compareRange.endDate, baseFilters),
        fetchSiteMetrics(propertyIds, range.startDate, range.endDate, []),
        fetchSiteMetrics(propertyIds, compareRange.startDate, compareRange.endDate, []),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["eventName"],
          metrics: ["eventCount"],
          limit: 50,
          orderByMetric: { name: "eventCount" },
          filters: baseFilters,
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: compareRange.startDate,
          endDate: compareRange.endDate,
          dimensions: ["eventName"],
          metrics: ["eventCount"],
          limit: 500,
          filters: baseFilters,
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["date", "eventName"],
          metrics: ["eventCount"],
          limit: 5000,
          filters: baseFilters,
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["hostName", "landingPagePlusQueryString"],
          metrics: ["sessions"],
          limit: 5000,
          orderByMetric: { name: "sessions" },
          filters: [aiFilter],
        }),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["eventName"],
          metrics: ["eventCount"],
          limit: 500,
          orderByMetric: { name: "eventCount" },
          filters: [aiFilter],
        }),
      ]);

      dailySessions = sessionsTs.rows
        .map((r) => ({ date: formatGa4Date(r.dimensionValues[0] ?? ""), value: Number(r.metricValues[0] ?? 0) }))
        .sort((a, b) => a.date.localeCompare(b.date));
      totalAiSessions = sessionsTs.rows.reduce((s, r) => s + Number(r.metricValues[0] ?? 0), 0);
      prevTotalAiSessions = prevSessionsTs.rows.reduce((s, r) => s + Number(r.metricValues[0] ?? 0), 0);

      topSources = topSourcesRows.rows.map((r) => ({
        name: r.dimensionValues[0] ?? "",
        value: Number(r.metricValues[0] ?? 0),
      }));

      pagesRows = fullUrlPagesGa4(pagesCurrent.rows);
      prevPagesByPath = new Map(fullUrlPagesGa4(pagesPrev.rows).map((r) => [r.dimensionValues[0] ?? "", r]));

      sourceWeeklyRows = sourceByDate.rows;
      trafficSourceRows = trafficSrc.rows;
      aiMetrics = aiTotals;
      prevAiMetrics = aiPrevTotals;
      totalSiteMetrics = totalTotals;
      prevTotalSiteMetrics = totalPrevTotals;
      eventsRows = eventsCurrent.rows;
      prevEventsByName = new Map(eventsPrev.rows.map((r) => [r.dimensionValues[0] ?? "", r]));
      eventsWeeklyRows = eventsByDate.rows;
      pageOptions = Array.from(new Set(pageOpts.rows.map((r) => {
        const host = r.dimensionValues[0] ?? "";
        const path = normalizePageUrl(r.dimensionValues[1] ?? "");
        return host ? `https://${host}${path}` : path;
      }).filter(Boolean)));
      eventOptions = eventOpts.rows.map((r) => r.dimensionValues[0] ?? "").filter(Boolean);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  // Pivot weekly stacked data
  const sourceWeekMap = new Map<string, Record<string, number>>();
  for (const r of sourceWeeklyRows) {
    const week = weekOf(r.dimensionValues[0] ?? "");
    const source = r.dimensionValues[1] ?? "";
    const sessions = Number(r.metricValues[0] ?? 0);
    if (!sourceWeekMap.has(week)) sourceWeekMap.set(week, {});
    sourceWeekMap.get(week)![source] = (sourceWeekMap.get(week)![source] || 0) + sessions;
  }
  const allSourcesInOrder = topSources.map((t) => t.name);
  const sourceWeeklyData = Array.from(sourceWeekMap.entries())
    .map(([week, sources]) => ({ week: formatWeekLabel(week), _sortKey: week, ...sources }))
    .sort((a, b) => a._sortKey.localeCompare(b._sortKey));

  const eventWeekMap = new Map<string, Record<string, number>>();
  for (const r of eventsWeeklyRows) {
    const week = weekOf(r.dimensionValues[0] ?? "");
    const event = r.dimensionValues[1] ?? "";
    const count = Number(r.metricValues[0] ?? 0);
    if (!eventWeekMap.has(week)) eventWeekMap.set(week, {});
    eventWeekMap.get(week)![event] = (eventWeekMap.get(week)![event] || 0) + count;
  }
  const topEventNames = eventsRows.slice(0, 12).map((r) => r.dimensionValues[0] ?? "");
  const eventWeeklyData = Array.from(eventWeekMap.entries())
    .map(([week, events]) => {
      const filtered: Record<string, number | string> = { week: formatWeekLabel(week), _sortKey: week };
      for (const e of topEventNames) filtered[e] = events[e] ?? 0;
      return filtered;
    })
    .sort((a, b) => String(a._sortKey).localeCompare(String(b._sortKey)));

  const totalConversions = eventsRows.reduce((s, r) => s + Number(r.metricValues[0] ?? 0), 0);
  const prevTotalConversions = Array.from(prevEventsByName.values()).reduce(
    (s, r) => s + Number(r.metricValues[0] ?? 0), 0
  );

  return (
    <>
      <PresentationHeader
        title="AI Breakdown"
        startDate={range.startDate}
        endDate={range.endDate}
        activeTab="ai"
        overviewHref={overviewHref}
        gscHref={gscHref}
        ga4Href={ga4Href}
        aiHref={aiHref}
        posthogHref={posthogHref}
      />
      <main className="bg-white min-h-screen">

      <AiControls
        properties={properties}
        currentProperties={propertyIds}
        currentDays={computedDays}
        currentStart={range.startDate}
        currentEnd={range.endDate}
        currentPageUrls={pageUrls}
        currentPageUrlsExclude={pageUrlsExclude}
        currentEventNames={eventNames}
        pageOptions={pageOptions}
        eventOptions={eventOptions}
      />

      {fetchError && (
        <div className="max-w-[1400px] mx-auto px-6 mt-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <details data-pdf-hide className="max-w-[1400px] mx-auto px-6 mt-4" open>
        <summary className="cursor-pointer text-xs uppercase tracking-wide text-gray-500 font-semibold not-italic">
          Filter diagnostics — server received + GA4 response
        </summary>
        <pre className="mt-2 text-[11px] bg-gray-900 text-gray-100 p-3 overflow-x-auto rounded-md not-italic leading-relaxed">
{JSON.stringify({
  receivedParams: {
    propertyId: sp.propertyId ?? null,
    pageUrl: sp.pageUrl ?? null,
    pageUrlExclude: sp.pageUrlExclude ?? null,
    eventName: sp.eventName ?? null,
    days: sp.days ?? null,
    start: sp.start ?? null,
    end: sp.end ?? null,
  },
  parsed: { pageUrls, pageUrlsExclude, eventNames, includePaths, excludePaths },
  baseFilters,
  ga4Response: {
    pagesRowsCount: pagesRows.length,
    pagesContainingExcludedSubstring: excludePaths.length > 0
      ? pagesRows.filter((r) => excludePaths.some((sub) =>
          (r.dimensionValues[0] ?? "").toLowerCase().includes(sub.toLowerCase())
        )).map((r) => ({ url: r.dimensionValues[0], sessions: r.metricValues[0] }))
      : [],
    first5Urls: pagesRows.slice(0, 5).map((r) => ({ url: r.dimensionValues[0], sessions: r.metricValues[0] })),
  },
}, null, 2)}
        </pre>
      </details>

      <section className="max-w-[1400px] mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h3 className="text-xl font-bold text-gray-900">Sessions by AI Source</h3>
          <p className="text-sm text-gray-500 mb-2">Tracks all sessions originating from AI tools.</p>
          <SessionsLineChart data={dailySessions} />
        </div>
        <TopSourcesDonut
          data={topSources}
          totalLabel="Total Sessions"
          totalValue={totalAiSessions}
          totalChange={pct(totalAiSessions, prevTotalAiSessions)}
        />
      </section>

      <section className="max-w-[1400px] mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableExport title="Top Pages from AI Traffic">
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <h3 className="text-base font-semibold text-gray-900">Top Pages from AI Traffic</h3>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black text-white text-xs sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Page</th>
                  <th className="px-3 py-2 text-right font-semibold">Sessions</th>
                  <th className="px-3 py-2 text-right font-semibold">% Δ</th>
                  <th className="px-3 py-2 text-right font-semibold">Event count</th>
                  <th className="px-3 py-2 text-right font-semibold">% Δ</th>
                </tr>
              </thead>
              <tbody>
                {pagesRows.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No AI traffic in this period</td></tr>
                )}
                {pagesRows.map((r, i) => {
                  const page = r.dimensionValues[0] ?? "";
                  const sessions = Number(r.metricValues[0] ?? 0);
                  const events = Number(r.metricValues[1] ?? 0);
                  const prev = prevPagesByPath.get(page);
                  const prevSessions = prev ? Number(prev.metricValues[0] ?? 0) : 0;
                  const prevEvents = prev ? Number(prev.metricValues[1] ?? 0) : 0;
                  const sessionsChange = pct(sessions, prevSessions);
                  const eventsChange = pct(events, prevEvents);
                  return (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-1.5 text-gray-500">{i + 1}.</td>
                      <td className="px-3 py-1.5 text-gray-900 max-w-[280px]">
                        <UrlCell url={page} />
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(sessions)}</td>
                      <td className="px-3 py-1.5 text-right text-xs">
                        {prev ? (
                          <span className={sessionsChange > 0 ? "text-emerald-600" : sessionsChange < 0 ? "text-rose-600" : "text-gray-400"}>
                            {sessionsChange > 0 ? "▲" : sessionsChange < 0 ? "▼" : "·"} {Math.abs(sessionsChange * 100).toFixed(1)}%
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(events)}</td>
                      <td className="px-3 py-1.5 text-right text-xs">
                        {prev ? (
                          <span className={eventsChange > 0 ? "text-emerald-600" : eventsChange < 0 ? "text-rose-600" : "text-gray-400"}>
                            {eventsChange > 0 ? "▲" : eventsChange < 0 ? "▼" : "·"} {Math.abs(eventsChange * 100).toFixed(1)}%
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </TableExport>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">AI Sessions over Time (by source)</h3>
          <StackedBarBySource data={sourceWeeklyData} sources={allSourcesInOrder} />
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 mt-8">
        <TableExport title="AI Traffic Source">
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-xl font-bold text-gray-900">Traffic Source</h3>
            <p className="text-sm text-gray-500">By source / medium — AI-only sessions.</p>
          </div>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black text-white text-xs sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Source / Medium</th>
                  <th className="px-3 py-2 text-right font-semibold">Users</th>
                  <th className="px-3 py-2 text-right font-semibold">New Users</th>
                  <th className="px-3 py-2 text-right font-semibold">Engagement Rate</th>
                  <th className="px-3 py-2 text-right font-semibold">Pages / Session</th>
                  <th className="px-3 py-2 text-right font-semibold">Avg. Session</th>
                  <th className="px-3 py-2 text-right font-semibold">Key Events</th>
                  <th className="px-3 py-2 text-right font-semibold">Event Count</th>
                </tr>
              </thead>
              <tbody>
                {trafficSourceRows.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">No data</td></tr>
                )}
                {trafficSourceRows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-1.5 font-medium">{r.dimensionValues[0]}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(Number(r.metricValues[0]))}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(Number(r.metricValues[1]))}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{(Number(r.metricValues[2]) * 100).toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{Number(r.metricValues[3]).toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatDuration(Number(r.metricValues[4]))}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(Number(r.metricValues[5]))}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(Number(r.metricValues[6]))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </TableExport>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 mt-8">
        <h3 className="text-center text-lg font-bold mb-3">AI Traffic Sources</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Users" value={formatBig(aiMetrics.users)} changePercent={pct(aiMetrics.users, prevAiMetrics.users)} />
          <StatCard label="Bounce rate" value={`${(aiMetrics.bounceRate * 100).toFixed(2)}%`} changePercent={pct(aiMetrics.bounceRate, prevAiMetrics.bounceRate)} invertColors />
          <StatCard label="Pages / Session" value={aiMetrics.screenPageViewsPerSession.toFixed(2)} changePercent={pct(aiMetrics.screenPageViewsPerSession, prevAiMetrics.screenPageViewsPerSession)} />
          <StatCard label="Avg. Duration" value={formatDuration(aiMetrics.averageSessionDuration)} changePercent={pct(aiMetrics.averageSessionDuration, prevAiMetrics.averageSessionDuration)} />
          <StatCard label="User key event rate" value={`${(aiMetrics.keyEventRate * 100).toFixed(2)}%`} changePercent={pct(aiMetrics.keyEventRate, prevAiMetrics.keyEventRate)} />
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 mt-8">
        <h3 className="text-center text-lg font-bold mb-3">Total Site Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Users" value={formatBig(totalSiteMetrics.users)} changePercent={pct(totalSiteMetrics.users, prevTotalSiteMetrics.users)} />
          <StatCard label="Bounce rate" value={`${(totalSiteMetrics.bounceRate * 100).toFixed(2)}%`} changePercent={pct(totalSiteMetrics.bounceRate, prevTotalSiteMetrics.bounceRate)} invertColors />
          <StatCard label="Pages / Session" value={totalSiteMetrics.screenPageViewsPerSession.toFixed(2)} changePercent={pct(totalSiteMetrics.screenPageViewsPerSession, prevTotalSiteMetrics.screenPageViewsPerSession)} />
          <StatCard label="Avg. Duration" value={formatDuration(totalSiteMetrics.averageSessionDuration)} changePercent={pct(totalSiteMetrics.averageSessionDuration, prevTotalSiteMetrics.averageSessionDuration)} />
          <StatCard label="User key event rate" value={`${(totalSiteMetrics.keyEventRate * 100).toFixed(2)}%`} changePercent={pct(totalSiteMetrics.keyEventRate, prevTotalSiteMetrics.keyEventRate)} />
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Conversion Overview</h3>
              <p className="text-sm text-gray-500">Events triggered by AI-referred users.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Conversions</p>
              <p className="text-2xl font-bold tabular-nums">{formatBig(totalConversions)}</p>
              <p className={`text-xs font-medium ${pct(totalConversions, prevTotalConversions) > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {pct(totalConversions, prevTotalConversions) > 0 ? "▲" : "▼"} {Math.abs(pct(totalConversions, prevTotalConversions) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <TableExport title="AI Conversion Overview — Events">
          <div className="max-h-[360px] overflow-y-auto border border-gray-200 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-black text-white text-xs sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Event</th>
                  <th className="px-3 py-2 text-right font-semibold">Conversions</th>
                  <th className="px-3 py-2 text-right font-semibold">% Δ</th>
                </tr>
              </thead>
              <tbody>
                {eventsRows.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No events from AI traffic</td></tr>
                )}
                {eventsRows.map((r, i) => {
                  const name = r.dimensionValues[0] ?? "";
                  const count = Number(r.metricValues[0] ?? 0);
                  const prev = prevEventsByName.get(name);
                  const prevCount = prev ? Number(prev.metricValues[0] ?? 0) : 0;
                  const change = pct(count, prevCount);
                  return (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-1.5 text-gray-500">{i + 1}.</td>
                      <td className="px-3 py-1.5">{name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(count)}</td>
                      <td className="px-3 py-1.5 text-right text-xs">
                        {prev ? (
                          <span className={change > 0 ? "text-emerald-600" : change < 0 ? "text-rose-600" : "text-gray-400"}>
                            {change > 0 ? "▲" : change < 0 ? "▼" : "·"} {Math.abs(change * 100).toFixed(1)}%
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </TableExport>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Events over Time</h3>
          <StackedBarByEvent data={eventWeeklyData} events={topEventNames} />
        </div>
      </section>

      </main>
      <PresentationFooter generatedAt={new Date()} />
    </>
  );
}
