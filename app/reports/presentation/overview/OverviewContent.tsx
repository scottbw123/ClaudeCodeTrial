import { queryGsc, queryGscFiltered, listSites, escapeRegex, type GscFilter } from "@/lib/gsc";
import { listProperties, runReport, type Ga4Filter } from "@/lib/ga4";
import { previousPeriod, rangeFromDays, daysBetween } from "@/lib/date-utils";
import { AI_SOURCES } from "@/lib/ai-sources";
import { PresentationHeader } from "../components/Header";
import { PresentationFooter } from "../components/Footer";
import { OverviewControls } from "./Controls";

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

function formatPct(n: number, digits = 2): string {
  return `${(n * 100).toFixed(digits)}%`;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec.toString().padStart(2, "0")}s`;
}

function MetricCard({
  label,
  value,
  source,
  changePercent,
  invertColors,
}: {
  label: string;
  value: string;
  source: "GSC" | "GA4";
  changePercent: number | null;
  invertColors?: boolean;
}) {
  let changeNode: React.ReactNode = <span className="text-xs text-gray-400">N/A</span>;
  if (changePercent !== null && isFinite(changePercent) && changePercent !== 0) {
    const positive = invertColors ? changePercent < 0 : changePercent > 0;
    const negative = invertColors ? changePercent > 0 : changePercent < 0;
    const color = positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-gray-400";
    const arrow = changePercent > 0 ? "▲" : "▼";
    changeNode = (
      <span className={`text-xs font-medium ${color}`}>
        {arrow} {Math.abs(changePercent * 100).toFixed(1)}%
      </span>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-600 leading-tight">{label}</p>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${source === "GSC" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
          {source}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <div className="mt-1">{changeNode}</div>
    </div>
  );
}

interface GscTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function gscTotals(
  siteUrl: string,
  startDate: string,
  endDate: string,
  extraFilters: GscFilter[]
): Promise<GscTotals> {
  const rows = await queryGsc({
    siteUrl, startDate, endDate, dimensions: [], rowLimit: 1, filters: extraFilters,
  });
  const r = rows[0];
  return r
    ? { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }
    : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
}

async function ga4Total(
  propertyId: string,
  startDate: string,
  endDate: string,
  metric: string,
  filters: Ga4Filter[]
): Promise<number> {
  const r = await runReport({
    propertyId, startDate, endDate, dimensions: [], metrics: [metric], filters,
  });
  return Number(r.totals[0] ?? 0);
}

export async function OverviewContent({ searchParams: sp, overviewHref, gscHref, ga4Href, aiHref }: Props) {
  const [sites, properties] = await Promise.all([listSites(), listProperties()]);
  const siteUrl = sp.site || sites[0]?.siteUrl || "";
  const propertyId = sp.propertyId || properties[0]?.propertyId || "";

  const hasCustom = Boolean(sp.start && sp.end);
  const days = Number(sp.days || 30);
  const range = hasCustom ? { startDate: sp.start!, endDate: sp.end! } : rangeFromDays(days);
  const computedDays = daysBetween(range.startDate, range.endDate);
  const compareRange = previousPeriod(range.startDate, range.endDate);

  const brandedTerms = (sp.branded || "").split(",").map((s) => s.trim()).filter(Boolean);
  const nonAppPattern = (sp.nonApp || "").trim();

  // GSC filter builders
  const brandedRegex = brandedTerms.length > 0
    ? brandedTerms.map(escapeRegex).join("|")
    : "";
  const brandedFilter: GscFilter[] = brandedRegex
    ? [{ dimension: "query", operator: "includingRegex", expression: `(${brandedRegex})` }]
    : [];
  const nonBrandedFilter: GscFilter[] = brandedRegex
    ? [{ dimension: "query", operator: "excludingRegex", expression: `(${brandedRegex})` }]
    : [];
  const nonAppPageFilter: GscFilter[] = nonAppPattern
    ? [{ dimension: "page", operator: "excludingRegex", expression: escapeRegex(nonAppPattern) }]
    : [];
  const nonBrandedNonAppFilter: GscFilter[] = [...nonBrandedFilter, ...nonAppPageFilter];

  // GA4 filter builders
  const organicFilter: Ga4Filter[] = [{ fieldName: "sessionDefaultChannelGroup", value: "Organic Search" }];
  const organicNonAppFilter: Ga4Filter[] = [
    ...organicFilter,
    ...(nonAppPattern ? [{ fieldName: "pageLocation", matchType: "CONTAINS" as const, value: nonAppPattern, negate: true }] : []),
  ];
  const aiAllFilter: Ga4Filter[] = [{ fieldName: "sessionSource", values: AI_SOURCES }];
  const aiNonAppFilter: Ga4Filter[] = [
    ...aiAllFilter,
    ...(nonAppPattern ? [{ fieldName: "pageLocation", matchType: "CONTAINS" as const, value: nonAppPattern, negate: true }] : []),
  ];
  const directNonAppFilter: Ga4Filter[] = [
    { fieldName: "sessionDefaultChannelGroup", value: "Direct" },
    ...(nonAppPattern ? [{ fieldName: "pageLocation", matchType: "CONTAINS" as const, value: nonAppPattern, negate: true }] : []),
  ];

  let fetchError: string | null = null;
  let gAll: GscTotals = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  let gAllPrev = gAll;
  let gBranded = gAll, gBrandedPrev = gAll;
  let gNbNa = gAll, gNbNaPrev = gAll;
  let bounceRate = 0, bounceRatePrev = 0;
  let pageDuration = 0, pageDurationPrev = 0;
  let aiTotal = 0, aiTotalPrev = 0;
  let aiNonApp = 0, aiNonAppPrev = 0;
  let directNonApp = 0, directNonAppPrev = 0;
  let organicConversions = 0, organicConversionsPrev = 0;
  let totalSessions = 0, totalSessionsPrev = 0;
  let totalKeyEvents = 0, totalKeyEventsPrev = 0;

  if (siteUrl && propertyId) {
    try {
      [
        gAll, gAllPrev,
        gBranded, gBrandedPrev,
        gNbNa, gNbNaPrev,
        bounceRate, bounceRatePrev,
        pageDuration, pageDurationPrev,
        aiTotal, aiTotalPrev,
        aiNonApp, aiNonAppPrev,
        directNonApp, directNonAppPrev,
        organicConversions, organicConversionsPrev,
        totalSessions, totalSessionsPrev,
        totalKeyEvents, totalKeyEventsPrev,
      ] = await Promise.all([
        gscTotals(siteUrl, range.startDate, range.endDate, []),
        gscTotals(siteUrl, compareRange.startDate, compareRange.endDate, []),
        gscTotals(siteUrl, range.startDate, range.endDate, brandedFilter),
        gscTotals(siteUrl, compareRange.startDate, compareRange.endDate, brandedFilter),
        gscTotals(siteUrl, range.startDate, range.endDate, nonBrandedNonAppFilter),
        gscTotals(siteUrl, compareRange.startDate, compareRange.endDate, nonBrandedNonAppFilter),
        ga4Total(propertyId, range.startDate, range.endDate, "bounceRate", organicNonAppFilter),
        ga4Total(propertyId, compareRange.startDate, compareRange.endDate, "bounceRate", organicNonAppFilter),
        ga4Total(propertyId, range.startDate, range.endDate, "averageSessionDuration", organicNonAppFilter),
        ga4Total(propertyId, compareRange.startDate, compareRange.endDate, "averageSessionDuration", organicNonAppFilter),
        ga4Total(propertyId, range.startDate, range.endDate, "sessions", aiAllFilter),
        ga4Total(propertyId, compareRange.startDate, compareRange.endDate, "sessions", aiAllFilter),
        ga4Total(propertyId, range.startDate, range.endDate, "sessions", aiNonAppFilter),
        ga4Total(propertyId, compareRange.startDate, compareRange.endDate, "sessions", aiNonAppFilter),
        ga4Total(propertyId, range.startDate, range.endDate, "sessions", directNonAppFilter),
        ga4Total(propertyId, compareRange.startDate, compareRange.endDate, "sessions", directNonAppFilter),
        ga4Total(propertyId, range.startDate, range.endDate, "keyEvents", organicFilter),
        ga4Total(propertyId, compareRange.startDate, compareRange.endDate, "keyEvents", organicFilter),
        ga4Total(propertyId, range.startDate, range.endDate, "sessions", []),
        ga4Total(propertyId, compareRange.startDate, compareRange.endDate, "sessions", []),
        ga4Total(propertyId, range.startDate, range.endDate, "keyEvents", []),
        ga4Total(propertyId, compareRange.startDate, compareRange.endDate, "keyEvents", []),
      ]);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  const conversionRate = totalSessions > 0 ? totalKeyEvents / totalSessions : 0;
  const conversionRatePrev = totalSessionsPrev > 0 ? totalKeyEventsPrev / totalSessionsPrev : 0;

  const metrics: Array<{
    label: string;
    value: string;
    source: "GSC" | "GA4";
    changePercent: number | null;
    invertColors?: boolean;
  }> = [
    { label: "Impressions (Total)", value: formatBig(gAll.impressions), source: "GSC", changePercent: pct(gAll.impressions, gAllPrev.impressions) },
    { label: "Impressions (Branded)", value: formatBig(gBranded.impressions), source: "GSC", changePercent: pct(gBranded.impressions, gBrandedPrev.impressions) },
    { label: "Impressions (Non-Branded; Non-App)", value: formatBig(gNbNa.impressions), source: "GSC", changePercent: pct(gNbNa.impressions, gNbNaPrev.impressions) },
    { label: "Avg. Position (Non-Branded; Non-App)", value: gNbNa.position > 0 ? gNbNa.position.toFixed(1) : "—", source: "GSC", changePercent: pct(gNbNa.position, gNbNaPrev.position), invertColors: true },
    { label: "Clicks (Total)", value: formatBig(gAll.clicks), source: "GSC", changePercent: pct(gAll.clicks, gAllPrev.clicks) },
    { label: "Clicks (Branded)", value: formatBig(gBranded.clicks), source: "GSC", changePercent: pct(gBranded.clicks, gBrandedPrev.clicks) },
    { label: "Clicks (Non-Branded; Non-App)", value: formatBig(gNbNa.clicks), source: "GSC", changePercent: pct(gNbNa.clicks, gNbNaPrev.clicks) },
    { label: "CTR (Non-Branded; Non-App)", value: formatPct(gNbNa.ctr), source: "GSC", changePercent: pct(gNbNa.ctr, gNbNaPrev.ctr) },
    { label: "Bounce Rate (Organic; Non-App)", value: formatPct(bounceRate), source: "GA4", changePercent: pct(bounceRate, bounceRatePrev), invertColors: true },
    { label: "Avg. Session Duration (Organic; Non-App)", value: formatDuration(pageDuration), source: "GA4", changePercent: pct(pageDuration, pageDurationPrev) },
    { label: "AI Referral Traffic (Total)", value: formatBig(aiTotal), source: "GA4", changePercent: pct(aiTotal, aiTotalPrev) },
    { label: "AI Referral Traffic (Non-App)", value: formatBig(aiNonApp), source: "GA4", changePercent: pct(aiNonApp, aiNonAppPrev) },
    { label: "Direct Source Traffic (Non-App)", value: formatBig(directNonApp), source: "GA4", changePercent: pct(directNonApp, directNonAppPrev) },
    { label: "Organic Conversions", value: formatBig(organicConversions), source: "GA4", changePercent: pct(organicConversions, organicConversionsPrev) },
    { label: "Conversion Rate (Site-wide)", value: formatPct(conversionRate, 2), source: "GA4", changePercent: pct(conversionRate, conversionRatePrev) },
  ];

  const helperUsedQueryFiltered = queryGscFiltered;
  void helperUsedQueryFiltered;

  return (
    <main className="bg-white min-h-screen">
      <PresentationHeader
        title="Overview"
        startDate={range.startDate}
        endDate={range.endDate}
        activeTab="overview"
        overviewHref={overviewHref}
        gscHref={gscHref}
        ga4Href={ga4Href}
        aiHref={aiHref}
      />

      <OverviewControls
        sites={sites}
        properties={properties}
        currentSite={siteUrl}
        currentProperty={propertyId}
        currentDays={computedDays}
        currentStart={range.startDate}
        currentEnd={range.endDate}
        currentBranded={brandedTerms}
        currentNonApp={nonAppPattern}
      />

      {fetchError && (
        <div className="max-w-[1400px] mx-auto px-6 mt-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {(brandedTerms.length === 0 || !nonAppPattern) && (
        <div className="max-w-[1400px] mx-auto px-6 mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800">
          {brandedTerms.length === 0 && <div>Add branded terms above to populate Branded / Non-Branded metrics.</div>}
          {!nonAppPattern && <div>Add a Non-App URL pattern to exclude app traffic from Non-App metrics.</div>}
        </div>
      )}

      <section className="max-w-[1400px] mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map((m) => (
            <MetricCard
              key={m.label}
              label={m.label}
              value={m.value}
              source={m.source}
              changePercent={m.changePercent}
              invertColors={m.invertColors}
            />
          ))}
        </div>
      </section>

      <PresentationFooter generatedAt={new Date()} />
    </main>
  );
}
