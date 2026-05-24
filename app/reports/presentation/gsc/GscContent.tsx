import { queryGsc, queryGscPaginated, listSites, escapeRegex, type GscFilter, type GscRow } from "@/lib/gsc";
import { previousPeriod, rangeFromDays, daysBetween } from "@/lib/date-utils";
import { PresentationHeader } from "../components/Header";
import { PresentationFooter } from "../components/Footer";
import { KpiCard, type KpiCardData } from "../components/KpiCard";
import { GscControls } from "./Controls";
import { MetricSection, type MetricSectionData } from "./MetricSection";
import { DeltaTable, type DeltaRow } from "./Tables";
import { DemographicsSection, type DeviceRow, type CountryRow } from "./Demographics";
import { ALPHA3_TO_NAME } from "./country-codes";

interface Props {
  searchParams: Record<string, string | undefined>;
  overviewHref: string;
  gscHref: string;
  ga4Href: string;
  aiHref: string;
}

function aggregate(rows: { clicks: number; impressions: number; position: number }[]) {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const position =
    impressions > 0
      ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions
      : 0;
  return { clicks, impressions, ctr, position };
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

async function fetchPeriod(siteUrl: string, startDate: string, endDate: string, filters: GscFilter[]): Promise<GscRow[]> {
  return queryGsc({ siteUrl, startDate, endDate, dimensions: ["date"], rowLimit: 1000, filters });
}

function buildCallouts(
  metricKey: "clicks" | "impressions" | "ctr" | "position",
  current30: GscRow[], prev30: GscRow[],
  current90: GscRow[], prev90: GscRow[],
  current180: GscRow[], prev180: GscRow[]
) {
  function totalFor(rows: GscRow[]): number {
    return aggregate(rows)[metricKey];
  }
  function bars(rows: GscRow[]) {
    return rows
      .map((r) => ({ date: r.keys[0] ?? "", value: r[metricKey] }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return [
    { label: "Last 30 Days", total: totalFor(current30), changePercent: pct(totalFor(current30), totalFor(prev30)), bars: bars(current30) },
    { label: "Last 90 Days", total: totalFor(current90), changePercent: pct(totalFor(current90), totalFor(prev90)), bars: bars(current90) },
    { label: "Last 180 Days", total: totalFor(current180), changePercent: pct(totalFor(current180), totalFor(prev180)), bars: bars(current180) },
  ];
}

function buildDeltaRows(current: GscRow[], previous: GscRow[]): DeltaRow[] {
  const prevByKey = new Map<string, GscRow>();
  for (const r of previous) {
    const k = r.keys[0];
    if (k) prevByKey.set(k, r);
  }
  return current.map((r) => {
    const key = r.keys[0] ?? "";
    const p = prevByKey.get(key);
    return {
      key,
      clicks: { current: r.clicks, changePercent: pct(r.clicks, p?.clicks ?? 0) },
      impressions: { current: r.impressions, changePercent: pct(r.impressions, p?.impressions ?? 0) },
      ctr: { current: r.ctr, changePercent: pct(r.ctr, p?.ctr ?? 0) },
      position: { current: r.position, changePercent: pct(r.position, p?.position ?? 0) },
    };
  });
}

export async function GscContent({ searchParams: sp, overviewHref, gscHref, ga4Href, aiHref }: Props) {
  const sites = await listSites();

  const siteUrl = sp.site || sites[0]?.siteUrl || "";
  const filterQueries = (sp.filterQuery || "").split(",").map((s) => s.trim()).filter(Boolean);
  const filterPages = (sp.filterPage || "").split(",").map((s) => s.trim()).filter(Boolean);

  const hasCustom = Boolean(sp.start && sp.end);
  const days = Number(sp.days || 30);
  const range = hasCustom ? { startDate: sp.start!, endDate: sp.end! } : rangeFromDays(days);
  const computedDays = daysBetween(range.startDate, range.endDate);
  const compareRange = previousPeriod(range.startDate, range.endDate);

  const MAX_FILTER_VALUES = 100;
  const filterWarnings: string[] = [];

  function buildRegexFilter(dimension: "query" | "page", values: string[]): GscFilter | null {
    if (values.length === 0) return null;
    if (values.length === 1) {
      return { dimension, operator: "equals", expression: values[0] };
    }
    let useValues = values;
    if (values.length > MAX_FILTER_VALUES) {
      useValues = values.slice(0, MAX_FILTER_VALUES);
      filterWarnings.push(
        `${dimension} filter capped at first ${MAX_FILTER_VALUES} of ${values.length} selections (GSC regex limit).`
      );
    }
    const escaped = useValues.map(escapeRegex).join("|");
    return { dimension, operator: "includingRegex", expression: `^(${escaped})$` };
  }

  const filters: GscFilter[] = [];
  const qf = buildRegexFilter("query", filterQueries);
  if (qf) filters.push(qf);
  const pf = buildRegexFilter("page", filterPages);
  if (pf) filters.push(pf);

  const range30 = rangeFromDays(30);
  const range90 = rangeFromDays(90);
  const range180 = rangeFromDays(180);
  const prev30 = previousPeriod(range30.startDate, range30.endDate);
  const prev90 = previousPeriod(range90.startDate, range90.endDate);
  const prev180 = previousPeriod(range180.startDate, range180.endDate);

  let fetchError: string | null = null;
  let currentSeries: GscRow[] = [];
  let previousSeries: GscRow[] = [];
  let topQueries: GscRow[] = [];
  let prevQueries: GscRow[] = [];
  let topPages: GscRow[] = [];
  let prevPages: GscRow[] = [];
  let queryOptionsRows: GscRow[] = [];
  let pageOptionsRows: GscRow[] = [];
  let currentDevices: GscRow[] = [];
  let previousDevices: GscRow[] = [];
  let currentCountries: GscRow[] = [];
  let c30: GscRow[] = [], p30: GscRow[] = [], c90: GscRow[] = [], p90: GscRow[] = [], c180: GscRow[] = [], p180: GscRow[] = [];

  if (siteUrl) {
    try {
      [
        currentSeries,
        previousSeries,
        topQueries,
        prevQueries,
        topPages,
        prevPages,
        queryOptionsRows,
        pageOptionsRows,
        currentDevices,
        previousDevices,
        currentCountries,
        c30, p30, c90, p90, c180, p180,
      ] = await Promise.all([
        fetchPeriod(siteUrl, range.startDate, range.endDate, filters),
        fetchPeriod(siteUrl, compareRange.startDate, compareRange.endDate, filters),
        queryGsc({ siteUrl, ...range, dimensions: ["query"], rowLimit: 500, filters }),
        queryGsc({ siteUrl, ...compareRange, dimensions: ["query"], rowLimit: 500, filters }),
        queryGsc({ siteUrl, ...range, dimensions: ["page"], rowLimit: 500, filters }),
        queryGsc({ siteUrl, ...compareRange, dimensions: ["page"], rowLimit: 500, filters }),
        queryGscPaginated({ siteUrl, ...range, dimensions: ["query"] }, 50000),
        queryGscPaginated({ siteUrl, ...range, dimensions: ["page"] }, 50000),
        queryGsc({ siteUrl, ...range, dimensions: ["device"], rowLimit: 10, filters }),
        queryGsc({ siteUrl, ...compareRange, dimensions: ["device"], rowLimit: 10, filters }),
        queryGsc({ siteUrl, ...range, dimensions: ["country"], rowLimit: 250, filters }),
        fetchPeriod(siteUrl, range30.startDate, range30.endDate, filters),
        fetchPeriod(siteUrl, prev30.startDate, prev30.endDate, filters),
        fetchPeriod(siteUrl, range90.startDate, range90.endDate, filters),
        fetchPeriod(siteUrl, prev90.startDate, prev90.endDate, filters),
        fetchPeriod(siteUrl, range180.startDate, range180.endDate, filters),
        fetchPeriod(siteUrl, prev180.startDate, prev180.endDate, filters),
      ]);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  const currentTotals = aggregate(currentSeries);
  const previousTotals = aggregate(previousSeries);

  const series = currentSeries
    .map((r) => ({
      date: r.keys[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const kpis: KpiCardData[] = [
    {
      label: "Impressions",
      value: formatBig(currentTotals.impressions),
      changePercent: pct(currentTotals.impressions, previousTotals.impressions),
      spark: series.map((p) => ({ date: p.date, value: p.impressions })),
    },
    {
      label: "CTR",
      value: `${(currentTotals.ctr * 100).toFixed(2)}%`,
      changePercent: pct(currentTotals.ctr, previousTotals.ctr),
      spark: series.map((p) => ({ date: p.date, value: p.ctr })),
    },
    {
      label: "Clicks",
      value: formatBig(currentTotals.clicks),
      changePercent: pct(currentTotals.clicks, previousTotals.clicks),
      spark: series.map((p) => ({ date: p.date, value: p.clicks })),
    },
    {
      label: "Average Position",
      value: currentTotals.position > 0 ? currentTotals.position.toFixed(1) : "—",
      changePercent: pct(currentTotals.position, previousTotals.position),
      invertColors: true,
      spark: series.map((p) => ({ date: p.date, value: p.position })),
    },
  ];

  const metricSections: MetricSectionData[] = [
    {
      title: "Impressions",
      description: "Tracks all search impressions via GSC.",
      series: series.map((p) => ({ date: p.date, value: p.impressions })),
      format: "int",
      callouts: buildCallouts("impressions", c30, p30, c90, p90, c180, p180),
    },
    {
      title: "Average Search Position",
      description: "Tracks average search position for queries from Google.",
      series: series.map((p) => ({ date: p.date, value: p.position })),
      format: "decimal",
      invertColors: true,
      callouts: buildCallouts("position", c30, p30, c90, p90, c180, p180),
    },
    {
      title: "Clicks",
      description: "Tracks all clicks to the website via GSC.",
      series: series.map((p) => ({ date: p.date, value: p.clicks })),
      format: "int",
      callouts: buildCallouts("clicks", c30, p30, c90, p90, c180, p180),
    },
    {
      title: "Click-Through Rate",
      description: "Tracks ratio of clicks from search impressions.",
      series: series.map((p) => ({ date: p.date, value: p.ctr })),
      format: "percent",
      callouts: buildCallouts("ctr", c30, p30, c90, p90, c180, p180),
    },
  ];

  const queryRows = buildDeltaRows(topQueries, prevQueries);
  const pageRows = buildDeltaRows(topPages, prevPages);

  const tableTotals = {
    clicks: currentTotals.clicks,
    impressions: currentTotals.impressions,
    ctr: currentTotals.ctr,
    position: currentTotals.position,
    clicksChange: pct(currentTotals.clicks, previousTotals.clicks),
    impressionsChange: pct(currentTotals.impressions, previousTotals.impressions),
    ctrChange: pct(currentTotals.ctr, previousTotals.ctr),
    positionChange: pct(currentTotals.position, previousTotals.position),
  };

  const devicePrev = new Map<string, GscRow>();
  for (const d of previousDevices) {
    const k = d.keys[0];
    if (k) devicePrev.set(k, d);
  }
  const devices: DeviceRow[] = currentDevices.map((d) => {
    const p = devicePrev.get(d.keys[0] ?? "");
    return {
      device: d.keys[0] ?? "",
      impressions: d.impressions,
      rank: d.position,
      ctr: d.ctr,
      impressionsChange: pct(d.impressions, p?.impressions ?? 0),
      rankChange: pct(d.position, p?.position ?? 0),
      ctrChange: pct(d.ctr, p?.ctr ?? 0),
    };
  });

  const countries: CountryRow[] = currentCountries
    .map((c) => {
      const code = (c.keys[0] ?? "").toUpperCase();
      return {
        code,
        name: ALPHA3_TO_NAME[code] ?? code,
        impressions: c.impressions,
        clicks: c.clicks,
        position: c.position,
        ctr: c.ctr,
      };
    })
    .filter((c) => c.impressions > 0)
    .sort((a, b) => b.impressions - a.impressions);

  return (
    <main className="bg-white min-h-screen">
      <PresentationHeader
        title="Google Search Console"
        startDate={range.startDate}
        endDate={range.endDate}
        activeTab="gsc"
        overviewHref={overviewHref}
        gscHref={gscHref}
        ga4Href={ga4Href}
        aiHref={aiHref}
      />

      <GscControls
        sites={sites}
        currentSite={siteUrl}
        currentDays={computedDays}
        currentStart={range.startDate}
        currentEnd={range.endDate}
        currentQueries={filterQueries}
        currentPages={filterPages}
        queryOptions={queryOptionsRows.map((r) => r.keys[0] ?? "").filter(Boolean)}
        pageOptions={pageOptionsRows.map((r) => r.keys[0] ?? "").filter(Boolean)}
      />

      {filterWarnings.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800">
          {filterWarnings.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}
      {fetchError && (
        <div className="max-w-[1400px] mx-auto px-6 mt-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <section className="max-w-[1400px] mx-auto px-6 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 divide-x divide-gray-200 border border-gray-200 rounded-lg bg-white shadow-sm">
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

      <section className="max-w-[1400px] mx-auto px-6 mt-8 space-y-6">
        <DeltaTable
          title="Search Queries"
          description="Tracks all search queries that generated impressions and clicks."
          keyLabel="Search Query"
          rows={queryRows}
          totals={tableTotals}
        />
        <DeltaTable
          title="Landing Pages"
          description="Tracks all landing pages that received impressions and clicks."
          keyLabel="Landing Page"
          rows={pageRows}
          totals={tableTotals}
        />
      </section>

      <section className="max-w-[1400px] mx-auto px-6 mt-8">
        <DemographicsSection
          devices={devices}
          countries={countries}
          totals={{
            impressions: currentTotals.impressions,
            clicks: currentTotals.clicks,
            position: currentTotals.position,
            ctr: currentTotals.ctr,
            impressionsChange: pct(currentTotals.impressions, previousTotals.impressions),
            rankChange: pct(currentTotals.position, previousTotals.position),
            ctrChange: pct(currentTotals.ctr, previousTotals.ctr),
          }}
        />
      </section>

      <PresentationFooter generatedAt={new Date()} />
    </main>
  );
}
