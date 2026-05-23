import { queryGsc, listSites, type GscFilter } from "@/lib/gsc";
import { listProperties } from "@/lib/ga4";
import { previousPeriod, rangeFromDays } from "@/lib/date-utils";
import { PresentationHeader } from "./Header";
import { PresentationFooter } from "./Footer";
import { Controls } from "./Controls";
import { KpiCard, type KpiCardData } from "./KpiCard";

interface PageProps {
  searchParams: Promise<{
    site?: string;
    propertyId?: string;
    days?: string;
    filterQuery?: string;
    filterPage?: string;
  }>;
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

function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return (current - previous) / previous;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export default async function PresentationPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const [sites, properties] = await Promise.all([listSites(), listProperties()]);

  const siteUrl = sp.site || sites[0]?.siteUrl || "";
  const propertyId = sp.propertyId || properties[0]?.propertyId || "";
  const days = Number(sp.days || 30);
  const filterQuery = sp.filterQuery || "";
  const filterPage = sp.filterPage || "";

  const range = rangeFromDays(days);
  const compareRange = previousPeriod(range.startDate, range.endDate);

  const filters: GscFilter[] = [];
  if (filterQuery) filters.push({ dimension: "query", operator: "equals", expression: filterQuery });
  if (filterPage) filters.push({ dimension: "page", operator: "equals", expression: filterPage });

  let currentSeries: { date: string; clicks: number; impressions: number; ctr: number; position: number }[] = [];
  let previousTotals = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  let topQueries: string[] = [];
  let topPages: string[] = [];
  let fetchError: string | null = null;

  if (siteUrl) {
    try {
      const [series, prevSeries, queries, pages] = await Promise.all([
        queryGsc({ siteUrl, ...range, dimensions: ["date"], rowLimit: 1000, filters }),
        queryGsc({ siteUrl, ...compareRange, dimensions: ["date"], rowLimit: 1000, filters }),
        queryGsc({ siteUrl, ...range, dimensions: ["query"], rowLimit: 50, filters }),
        queryGsc({ siteUrl, ...range, dimensions: ["page"], rowLimit: 50, filters }),
      ]);
      currentSeries = series
        .map((r) => ({
          date: r.keys[0] ?? "",
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      previousTotals = aggregate(prevSeries);
      topQueries = queries.map((r) => r.keys[0] ?? "").filter(Boolean);
      topPages = pages.map((r) => r.keys[0] ?? "").filter(Boolean);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  const currentTotals = aggregate(currentSeries);

  const kpis: KpiCardData[] = [
    {
      label: "Impressions",
      value: formatNumber(currentTotals.impressions),
      changePercent: pctChange(currentTotals.impressions, previousTotals.impressions),
      spark: currentSeries.map((p) => ({ date: p.date, value: p.impressions })),
    },
    {
      label: "CTR",
      value: `${(currentTotals.ctr * 100).toFixed(2)}%`,
      changePercent: pctChange(currentTotals.ctr, previousTotals.ctr),
      spark: currentSeries.map((p) => ({ date: p.date, value: p.ctr })),
    },
    {
      label: "Clicks",
      value: formatNumber(currentTotals.clicks),
      changePercent: pctChange(currentTotals.clicks, previousTotals.clicks),
      spark: currentSeries.map((p) => ({ date: p.date, value: p.clicks })),
    },
    {
      label: "Average Position",
      value: currentTotals.position > 0 ? currentTotals.position.toFixed(1) : "—",
      changePercent: pctChange(currentTotals.position, previousTotals.position),
      invertColors: true,
      spark: currentSeries.map((p) => ({ date: p.date, value: p.position })),
    },
  ];

  return (
    <main className="bg-white min-h-screen">
      <PresentationHeader title="Google Search Console" startDate={range.startDate} endDate={range.endDate} />

      <Controls
        sites={sites}
        properties={properties}
        currentSite={siteUrl}
        currentProperty={propertyId}
        currentDays={days}
        currentQuery={filterQuery}
        currentPage={filterPage}
        queryOptions={topQueries}
        pageOptions={topPages}
      />

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

      <section className="max-w-[1400px] mx-auto px-6 mt-10">
        <p className="text-sm text-gray-400">
          (Big metric charts, queries & pages tables, and demographics + map sections are next.)
        </p>
      </section>

      <PresentationFooter generatedAt={new Date()} />
    </main>
  );
}
