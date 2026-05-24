import { listProperties, runReportMultiProperty, type Ga4Filter, type Ga4Row } from "@/lib/ga4";
import { normalizePageUrl } from "@/lib/gsc";

function normalizePageRows(rows: Ga4Row[]): Ga4Row[] {
  const grouped = new Map<string, Ga4Row>();
  for (const r of rows) {
    const url = r.dimensionValues[0] ?? "";
    const norm = normalizePageUrl(url);
    const existing = grouped.get(norm);
    if (!existing) {
      grouped.set(norm, {
        dimensionValues: [norm, ...r.dimensionValues.slice(1)],
        metricValues: [...r.metricValues],
      });
    } else {
      for (let i = 0; i < r.metricValues.length; i++) {
        const sum = Number(existing.metricValues[i] ?? 0) + Number(r.metricValues[i] ?? 0);
        existing.metricValues[i] = String(sum);
      }
    }
  }
  return Array.from(grouped.values()).sort((a, b) =>
    Number(b.metricValues[0] ?? 0) - Number(a.metricValues[0] ?? 0)
  );
}
import { previousPeriod, rangeFromDays, daysBetween } from "@/lib/date-utils";
import { PresentationHeader } from "../components/Header";
import { PresentationFooter } from "../components/Footer";
import { KpiCard, type KpiCardData } from "../components/KpiCard";
import { Ga4Controls } from "./Controls";
import { MetricSection, type MetricSectionData } from "../gsc/MetricSection";
import { Ga4Tables } from "./Tables";

interface Props {
  searchParams: Record<string, string | undefined>;
  overviewHref: string;
  gscHref: string;
  ga4Href: string;
  aiHref: string;
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

function formatGa4Date(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

interface SummaryTotals {
  sessions: number;
  activeUsers: number;
  newUsers: number;
  bounceRate: number;
  averageSessionDuration: number;
  screenPageViewsPerSession: number;
  newUserPercent: number;
}

function toTotals(values: string[]): SummaryTotals {
  const sessions = Number(values[0] ?? 0);
  const activeUsers = Number(values[1] ?? 0);
  const newUsers = Number(values[2] ?? 0);
  return {
    sessions,
    activeUsers,
    newUsers,
    bounceRate: Number(values[3] ?? 0),
    averageSessionDuration: Number(values[4] ?? 0),
    screenPageViewsPerSession: Number(values[5] ?? 0),
    newUserPercent: activeUsers > 0 ? newUsers / activeUsers : 0,
  };
}

async function fetchTotals(propertyIds: string[], startDate: string, endDate: string, filters: Ga4Filter[]) {
  const r = await runReportMultiProperty({
    propertyIds,
    startDate,
    endDate,
    dimensions: [],
    metrics: ["sessions", "activeUsers", "newUsers", "bounceRate", "averageSessionDuration", "screenPageViewsPerSession"],
    filters,
  });
  return toTotals(r.totals);
}

async function fetchTimeseries(propertyIds: string[], startDate: string, endDate: string, filters: Ga4Filter[]) {
  const r = await runReportMultiProperty({
    propertyIds,
    startDate,
    endDate,
    dimensions: ["date"],
    metrics: ["sessions", "activeUsers", "newUsers", "bounceRate", "averageSessionDuration"],
    limit: 500,
    filters,
  });
  return r.rows
    .map((row) => ({
      date: formatGa4Date(row.dimensionValues[0] ?? ""),
      sessions: Number(row.metricValues[0] ?? 0),
      activeUsers: Number(row.metricValues[1] ?? 0),
      newUsers: Number(row.metricValues[2] ?? 0),
      bounceRate: Number(row.metricValues[3] ?? 0),
      averageSessionDuration: Number(row.metricValues[4] ?? 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function sumMetric(rows: Ga4Row[], idx: number): number {
  return rows.reduce((s, r) => s + Number(r.metricValues[idx] ?? 0), 0);
}

export async function Ga4Content({ searchParams: sp, overviewHref, gscHref, ga4Href, aiHref }: Props) {
  const properties = await listProperties();

  const propertyIds = (sp.propertyId || properties[0]?.propertyId || "").split(",").map((s) => s.trim()).filter(Boolean);

  const hasCustom = Boolean(sp.start && sp.end);
  const days = Number(sp.days || 30);
  const range = hasCustom ? { startDate: sp.start!, endDate: sp.end! } : rangeFromDays(days);
  const computedDays = daysBetween(range.startDate, range.endDate);
  const compareRange = previousPeriod(range.startDate, range.endDate);

  const channels = (sp.channel || "").split(",").map((s) => s.trim()).filter(Boolean);
  const pageUrls = (sp.pageUrl || "").split(",").map((s) => s.trim()).filter(Boolean);
  const eventNames = (sp.eventName || "").split(",").map((s) => s.trim()).filter(Boolean);

  const filters: Ga4Filter[] = [];
  if (channels.length === 1) {
    filters.push({ fieldName: "sessionDefaultChannelGroup", value: channels[0] });
  } else if (channels.length > 1) {
    filters.push({ fieldName: "sessionDefaultChannelGroup", values: channels });
  }
  if (pageUrls.length === 1) {
    filters.push({ fieldName: "landingPagePlusQueryString", matchType: "CONTAINS", value: pageUrls[0] });
  } else if (pageUrls.length > 1) {
    filters.push({ fieldName: "landingPagePlusQueryString", values: pageUrls });
  }
  if (eventNames.length === 1) {
    filters.push({ fieldName: "eventName", value: eventNames[0] });
  } else if (eventNames.length > 1) {
    filters.push({ fieldName: "eventName", values: eventNames });
  }

  const eventFiltersForEvents: Ga4Filter[] = [...filters];
  if (sp.keyEvent === "true") eventFiltersForEvents.push({ fieldName: "isKeyEvent", value: "true" });
  if (sp.keyEvent === "false") eventFiltersForEvents.push({ fieldName: "isKeyEvent", value: "false" });

  const range30 = rangeFromDays(30);
  const range90 = rangeFromDays(90);
  const range180 = rangeFromDays(180);
  const prev30 = previousPeriod(range30.startDate, range30.endDate);
  const prev90 = previousPeriod(range90.startDate, range90.endDate);
  const prev180 = previousPeriod(range180.startDate, range180.endDate);

  let fetchError: string | null = null;
  let currentTotals: SummaryTotals = toTotals([]);
  let previousTotals: SummaryTotals = toTotals([]);
  let timeseries: Awaited<ReturnType<typeof fetchTimeseries>> = [];
  let trafficSources: Ga4Row[] = [];
  let events: Ga4Row[] = [];
  let pagePerformance: Ga4Row[] = [];
  let channelOptions: string[] = [];
  let pageOptions: string[] = [];
  let eventOptions: string[] = [];
  let t30 = toTotals([]), t30p = toTotals([]), t90 = toTotals([]), t90p = toTotals([]), t180 = toTotals([]), t180p = toTotals([]);
  let s30: Awaited<ReturnType<typeof fetchTimeseries>> = [], s90: Awaited<ReturnType<typeof fetchTimeseries>> = [], s180: Awaited<ReturnType<typeof fetchTimeseries>> = [];

  if (propertyIds.length > 0) {
    try {
      [
        currentTotals,
        previousTotals,
        timeseries,
        trafficSources,
        events,
        pagePerformance,
        channelOptions,
        pageOptions,
        eventOptions,
        t30, t30p, t90, t90p, t180, t180p,
        s30, s90, s180,
      ] = await Promise.all([
        fetchTotals(propertyIds, range.startDate, range.endDate, filters),
        fetchTotals(propertyIds, compareRange.startDate, compareRange.endDate, filters),
        fetchTimeseries(propertyIds, range.startDate, range.endDate, filters),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["sessionDefaultChannelGroup", "sessionSourceMedium"],
          metrics: ["sessions", "activeUsers", "bounceRate", "averageSessionDuration", "screenPageViewsPerSession", "keyEvents"],
          limit: 25,
          orderByMetric: { name: "sessions" },
          filters,
        }).then((r) => r.rows),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["eventName", "isKeyEvent"],
          metrics: ["eventCount", "totalUsers", "eventCountPerUser"],
          limit: 50,
          orderByMetric: { name: "eventCount" },
          filters: eventFiltersForEvents,
        }).then((r) => r.rows),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["landingPagePlusQueryString"],
          metrics: ["screenPageViews", "activeUsers", "sessions", "eventCount", "keyEvents"],
          limit: 50,
          orderByMetric: { name: "screenPageViews" },
          filters,
        }).then((r) => r.rows),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["sessionDefaultChannelGroup"],
          metrics: ["sessions"],
          limit: 100,
          orderByMetric: { name: "sessions" },
        }).then((r) => r.rows.map((row) => row.dimensionValues[0]).filter(Boolean)),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["landingPagePlusQueryString"],
          metrics: ["screenPageViews"],
          limit: 50000,
          orderByMetric: { name: "screenPageViews" },
        }).then((r) => r.rows.map((row) => row.dimensionValues[0]).filter(Boolean)),
        runReportMultiProperty({
          propertyIds,
          startDate: range.startDate,
          endDate: range.endDate,
          dimensions: ["eventName"],
          metrics: ["eventCount"],
          limit: 1000,
          orderByMetric: { name: "eventCount" },
        }).then((r) => r.rows.map((row) => row.dimensionValues[0]).filter(Boolean)),
        fetchTotals(propertyIds, range30.startDate, range30.endDate, filters),
        fetchTotals(propertyIds, prev30.startDate, prev30.endDate, filters),
        fetchTotals(propertyIds, range90.startDate, range90.endDate, filters),
        fetchTotals(propertyIds, prev90.startDate, prev90.endDate, filters),
        fetchTotals(propertyIds, range180.startDate, range180.endDate, filters),
        fetchTotals(propertyIds, prev180.startDate, prev180.endDate, filters),
        fetchTimeseries(propertyIds, range30.startDate, range30.endDate, filters),
        fetchTimeseries(propertyIds, range90.startDate, range90.endDate, filters),
        fetchTimeseries(propertyIds, range180.startDate, range180.endDate, filters),
      ]);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}m ${sec.toString().padStart(2, "0")}s`;
  };

  const kpis: KpiCardData[] = [
    {
      label: "Users",
      value: formatBig(currentTotals.activeUsers),
      changePercent: pct(currentTotals.activeUsers, previousTotals.activeUsers),
      spark: timeseries.map((p) => ({ date: p.date, value: p.activeUsers })),
    },
    {
      label: "Sessions",
      value: formatBig(currentTotals.sessions),
      changePercent: pct(currentTotals.sessions, previousTotals.sessions),
      spark: timeseries.map((p) => ({ date: p.date, value: p.sessions })),
    },
    {
      label: "Bounce Rate",
      value: `${(currentTotals.bounceRate * 100).toFixed(2)}%`,
      changePercent: pct(currentTotals.bounceRate, previousTotals.bounceRate),
      invertColors: true,
      spark: timeseries.map((p) => ({ date: p.date, value: p.bounceRate })),
    },
    {
      label: "Avg. Session",
      value: formatDuration(currentTotals.averageSessionDuration),
      changePercent: pct(currentTotals.averageSessionDuration, previousTotals.averageSessionDuration),
      spark: timeseries.map((p) => ({ date: p.date, value: p.averageSessionDuration })),
    },
    {
      label: "Pages / Session",
      value: currentTotals.screenPageViewsPerSession.toFixed(2),
      changePercent: pct(currentTotals.screenPageViewsPerSession, previousTotals.screenPageViewsPerSession),
      spark: timeseries.map((p) => ({ date: p.date, value: p.sessions > 0 ? p.activeUsers / p.sessions : 0 })),
    },
    {
      label: "New Users",
      value: `${(currentTotals.newUserPercent * 100).toFixed(1)}%`,
      changePercent: pct(currentTotals.newUserPercent, previousTotals.newUserPercent),
      spark: timeseries.map((p) => ({ date: p.date, value: p.newUsers })),
    },
  ];

  function calloutsFor(
    metric: keyof Omit<SummaryTotals, "newUserPercent">,
    t30v: SummaryTotals, t30pv: SummaryTotals,
    t90v: SummaryTotals, t90pv: SummaryTotals,
    t180v: SummaryTotals, t180pv: SummaryTotals,
    series30: typeof timeseries, series90: typeof timeseries, series180: typeof timeseries,
    seriesKey: keyof (typeof timeseries)[number]
  ) {
    return [
      {
        label: "Last 30 Days",
        total: t30v[metric],
        changePercent: pct(t30v[metric], t30pv[metric]),
        bars: series30.map((p) => ({ date: p.date, value: typeof p[seriesKey] === "number" ? (p[seriesKey] as number) : 0 })),
      },
      {
        label: "Last 90 Days",
        total: t90v[metric],
        changePercent: pct(t90v[metric], t90pv[metric]),
        bars: series90.map((p) => ({ date: p.date, value: typeof p[seriesKey] === "number" ? (p[seriesKey] as number) : 0 })),
      },
      {
        label: "Last 180 Days",
        total: t180v[metric],
        changePercent: pct(t180v[metric], t180pv[metric]),
        bars: series180.map((p) => ({ date: p.date, value: typeof p[seriesKey] === "number" ? (p[seriesKey] as number) : 0 })),
      },
    ];
  }

  const metricSections: MetricSectionData[] = [
    {
      title: "Users",
      description: "Active users across the property.",
      series: timeseries.map((p) => ({ date: p.date, value: p.activeUsers })),
      format: "int",
      callouts: calloutsFor("activeUsers", t30, t30p, t90, t90p, t180, t180p, s30, s90, s180, "activeUsers"),
    },
    {
      title: "Sessions",
      description: "Total sessions over time.",
      series: timeseries.map((p) => ({ date: p.date, value: p.sessions })),
      format: "int",
      callouts: calloutsFor("sessions", t30, t30p, t90, t90p, t180, t180p, s30, s90, s180, "sessions"),
    },
    {
      title: "Bounce Rate",
      description: "Share of single-page sessions (lower is better).",
      series: timeseries.map((p) => ({ date: p.date, value: p.bounceRate })),
      format: "percent",
      invertColors: true,
      callouts: calloutsFor("bounceRate", t30, t30p, t90, t90p, t180, t180p, s30, s90, s180, "bounceRate"),
    },
    {
      title: "Avg. Session Duration",
      description: "Mean session length in seconds.",
      series: timeseries.map((p) => ({ date: p.date, value: p.averageSessionDuration })),
      format: "decimal",
      callouts: calloutsFor("averageSessionDuration", t30, t30p, t90, t90p, t180, t180p, s30, s90, s180, "averageSessionDuration"),
    },
  ];

  return (
    <>
      <PresentationHeader
        title="Google Analytics 4"
        startDate={range.startDate}
        endDate={range.endDate}
        activeTab="ga4"
        overviewHref={overviewHref}
        gscHref={gscHref}
        ga4Href={ga4Href}
        aiHref={aiHref}
      />
      <main className="bg-white min-h-screen">

      <Ga4Controls
        properties={properties}
        currentProperties={propertyIds}
        currentDays={computedDays}
        currentStart={range.startDate}
        currentEnd={range.endDate}
        currentChannels={channels}
        currentPageUrls={pageUrls}
        currentKeyEvent={sp.keyEvent || ""}
        currentEventNames={eventNames}
        channelOptions={channelOptions}
        pageOptions={Array.from(new Set(pageOptions.map(normalizePageUrl).filter(Boolean)))}
        eventOptions={eventOptions}
      />

      {fetchError && (
        <div className="max-w-[1400px] mx-auto px-6 mt-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <section className="max-w-[1400px] mx-auto px-6 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-2 divide-x divide-gray-200 border border-gray-200 rounded-lg bg-white shadow-sm">
          {kpis.map((k) => (
            <KpiCard key={k.label} data={k} />
          ))}
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metricSections.map((m) => (
          <MetricSection key={m.title} data={m} />
        ))}
      </section>

      <Ga4Tables trafficSources={trafficSources} events={events} pagePerformance={normalizePageRows(pagePerformance)} />

      </main>
      <PresentationFooter generatedAt={new Date()} />
    </>
  );
}
