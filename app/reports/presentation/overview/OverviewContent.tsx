import { queryGscMultiSiteRaw, listSites, escapeRegex, type GscFilter } from "@/lib/gsc";
import { listProperties, runReportMultiProperty, type Ga4Filter } from "@/lib/ga4";
import { previousPeriod, rangeFromDays, daysBetween } from "@/lib/date-utils";
import { AI_SOURCES } from "@/lib/ai-sources";
import { PresentationHeader } from "../components/Header";
import { PresentationFooter } from "../components/Footer";
import { OverviewControls } from "./Controls";
import { OverviewMetricCard, type Sparkpoint } from "./MetricCard";
import { BrandedComparison } from "./BrandedComparison";

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

function formatGa4Date(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

interface DailyRow { date: string; values: number[] }

async function gscDailySeries(
  siteUrls: string[], startDate: string, endDate: string, extraFilters: GscFilter[]
): Promise<DailyRow[]> {
  if (siteUrls.length === 0) return [];
  const rows = await queryGscMultiSiteRaw({
    siteUrls, startDate, endDate, dimensions: ["date"], rowLimit: 1000, filters: extraFilters,
  });
  return rows
    .map((r) => ({ date: r.keys[0] ?? "", values: [r.impressions, r.clicks, r.ctr, r.position] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function ga4DailySeries(
  propertyIds: string[], startDate: string, endDate: string, metric: string, filters: Ga4Filter[]
): Promise<DailyRow[]> {
  if (propertyIds.length === 0) return [];
  const r = await runReportMultiProperty({
    propertyIds, startDate, endDate, dimensions: ["date"], metrics: [metric], limit: 500, filters,
  });
  return r.rows
    .map((row) => ({ date: formatGa4Date(row.dimensionValues[0] ?? ""), values: [Number(row.metricValues[0] ?? 0)] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function sumIndex(daily: DailyRow[], idx: number): number {
  return daily.reduce((s, d) => s + (d.values[idx] ?? 0), 0);
}

function weightedPosition(daily: DailyRow[]): number {
  // GSC dailies return position (idx=3) and impressions (idx=0)
  let weightedSum = 0;
  let totalImps = 0;
  for (const d of daily) {
    const imps = d.values[0] ?? 0;
    const pos = d.values[3] ?? 0;
    weightedSum += pos * imps;
    totalImps += imps;
  }
  return totalImps > 0 ? weightedSum / totalImps : 0;
}

function ratio(top: number, bottom: number): number {
  return bottom > 0 ? top / bottom : 0;
}

function spark(daily: DailyRow[], idx: number): Sparkpoint[] {
  return daily.map((d) => ({ date: d.date, value: d.values[idx] ?? 0 }));
}

export async function OverviewContent({ searchParams: sp, overviewHref, gscHref, ga4Href, aiHref }: Props) {
  const [sites, properties] = await Promise.all([listSites(), listProperties()]);
  const siteUrls = (sp.site || sites[0]?.siteUrl || "").split(",").map((s) => s.trim()).filter(Boolean);
  const propertyIds = (sp.propertyId || properties[0]?.propertyId || "").split(",").map((s) => s.trim()).filter(Boolean);

  const hasCustom = Boolean(sp.start && sp.end);
  const days = Number(sp.days || 30);
  const range = hasCustom ? { startDate: sp.start!, endDate: sp.end! } : rangeFromDays(days);
  const computedDays = daysBetween(range.startDate, range.endDate);
  const compareRange = previousPeriod(range.startDate, range.endDate);

  const brandedTerms = (sp.branded || "").split(",").map((s) => s.trim()).filter(Boolean);
  const conversionEvents = (sp.events || "").split(",").map((s) => s.trim()).filter(Boolean);

  const brandedRegex = brandedTerms.length > 0 ? brandedTerms.map(escapeRegex).join("|") : "";
  const brandedFilter: GscFilter[] = brandedRegex
    ? [{ dimension: "query", operator: "includingRegex", expression: `(${brandedRegex})` }]
    : [];
  const nonBrandedFilter: GscFilter[] = brandedRegex
    ? [{ dimension: "query", operator: "excludingRegex", expression: `(${brandedRegex})` }]
    : [];

  const organicFilter: Ga4Filter[] = [{ fieldName: "sessionDefaultChannelGroup", value: "Organic Search" }];
  // AI Referral = AI sources arriving via referral medium specifically (not organic, etc.)
  const aiAllFilter: Ga4Filter[] = [
    { fieldName: "sessionSource", values: AI_SOURCES },
    { fieldName: "sessionMedium", value: "referral" },
  ];
  const directFilter: Ga4Filter[] = [{ fieldName: "sessionDefaultChannelGroup", value: "Direct" }];
  const eventFilter: Ga4Filter[] = conversionEvents.length > 0
    ? [{ fieldName: "eventName", values: conversionEvents }]
    : [];

  // AI Referral Conversions = events from AI sources (via referral medium) filtered to selected events
  const aiEventFilter: Ga4Filter[] = [...aiAllFilter, ...eventFilter];

  // Get event options for the filter dropdown
  let eventOptions: string[] = [];

  let fetchError: string | null = null;
  let gAll: DailyRow[] = [], gAllPrev: DailyRow[] = [];
  let gBranded: DailyRow[] = [], gBrandedPrev: DailyRow[] = [];
  let gNonBranded: DailyRow[] = [], gNonBrandedPrev: DailyRow[] = [];
  let bounceDaily: DailyRow[] = [], bouncePrevDaily: DailyRow[] = [];
  let durDaily: DailyRow[] = [], durPrevDaily: DailyRow[] = [];
  let aiDaily: DailyRow[] = [], aiPrevDaily: DailyRow[] = [];
  let directDaily: DailyRow[] = [], directPrevDaily: DailyRow[] = [];
  let eventsDaily: DailyRow[] = [], eventsPrevDaily: DailyRow[] = [];
  let usersDaily: DailyRow[] = [], usersPrevDaily: DailyRow[] = [];
  let aiEventsDaily: DailyRow[] = [], aiEventsPrevDaily: DailyRow[] = [];

  if (siteUrls.length > 0 && propertyIds.length > 0) {
    try {
      const eventOptsResult = await runReportMultiProperty({
        propertyIds, startDate: range.startDate, endDate: range.endDate,
        dimensions: ["eventName"], metrics: ["eventCount"], limit: 500,
        orderByMetric: { name: "eventCount" },
      });
      eventOptions = eventOptsResult.rows.map((r) => r.dimensionValues[0] ?? "").filter(Boolean);

      [
        gAll, gAllPrev,
        gBranded, gBrandedPrev,
        gNonBranded, gNonBrandedPrev,
        bounceDaily, bouncePrevDaily,
        durDaily, durPrevDaily,
        aiDaily, aiPrevDaily,
        directDaily, directPrevDaily,
        eventsDaily, eventsPrevDaily,
        usersDaily, usersPrevDaily,
        aiEventsDaily, aiEventsPrevDaily,
      ] = await Promise.all([
        gscDailySeries(siteUrls, range.startDate, range.endDate, []),
        gscDailySeries(siteUrls, compareRange.startDate, compareRange.endDate, []),
        gscDailySeries(siteUrls, range.startDate, range.endDate, brandedFilter),
        gscDailySeries(siteUrls, compareRange.startDate, compareRange.endDate, brandedFilter),
        gscDailySeries(siteUrls, range.startDate, range.endDate, nonBrandedFilter),
        gscDailySeries(siteUrls, compareRange.startDate, compareRange.endDate, nonBrandedFilter),
        ga4DailySeries(propertyIds, range.startDate, range.endDate, "bounceRate", organicFilter),
        ga4DailySeries(propertyIds, compareRange.startDate, compareRange.endDate, "bounceRate", organicFilter),
        ga4DailySeries(propertyIds, range.startDate, range.endDate, "averageSessionDuration", organicFilter),
        ga4DailySeries(propertyIds, compareRange.startDate, compareRange.endDate, "averageSessionDuration", organicFilter),
        ga4DailySeries(propertyIds, range.startDate, range.endDate, "sessions", aiAllFilter),
        ga4DailySeries(propertyIds, compareRange.startDate, compareRange.endDate, "sessions", aiAllFilter),
        ga4DailySeries(propertyIds, range.startDate, range.endDate, "sessions", directFilter),
        ga4DailySeries(propertyIds, compareRange.startDate, compareRange.endDate, "sessions", directFilter),
        ga4DailySeries(propertyIds, range.startDate, range.endDate, "eventCount", eventFilter),
        ga4DailySeries(propertyIds, compareRange.startDate, compareRange.endDate, "eventCount", eventFilter),
        ga4DailySeries(propertyIds, range.startDate, range.endDate, "activeUsers", []),
        ga4DailySeries(propertyIds, compareRange.startDate, compareRange.endDate, "activeUsers", []),
        ga4DailySeries(propertyIds, range.startDate, range.endDate, "eventCount", aiEventFilter),
        ga4DailySeries(propertyIds, compareRange.startDate, compareRange.endDate, "eventCount", aiEventFilter),
      ]);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  // GSC value index: 0=impressions, 1=clicks, 2=ctr (per-day, not aggregated), 3=position
  const totalImpressions = sumIndex(gAll, 0);
  const totalImpressionsPrev = sumIndex(gAllPrev, 0);
  const totalClicks = sumIndex(gAll, 1);
  const totalClicksPrev = sumIndex(gAllPrev, 1);

  const brandedImpressions = sumIndex(gBranded, 0);
  const brandedImpressionsPrev = sumIndex(gBrandedPrev, 0);
  const brandedClicks = sumIndex(gBranded, 1);
  const brandedClicksPrev = sumIndex(gBrandedPrev, 1);

  const nbImpressions = sumIndex(gNonBranded, 0);
  const nbImpressionsPrev = sumIndex(gNonBrandedPrev, 0);
  const nbClicks = sumIndex(gNonBranded, 1);
  const nbClicksPrev = sumIndex(gNonBrandedPrev, 1);
  const nbPosition = weightedPosition(gNonBranded);
  const nbPositionPrev = weightedPosition(gNonBrandedPrev);
  const nbCtr = ratio(nbClicks, nbImpressions);
  const nbCtrPrev = ratio(nbClicksPrev, nbImpressionsPrev);
  const brandedPosition = weightedPosition(gBranded);
  const brandedPositionPrev = weightedPosition(gBrandedPrev);
  const brandedCtr = ratio(brandedClicks, brandedImpressions);
  const brandedCtrPrev = ratio(brandedClicksPrev, brandedImpressionsPrev);

  // GA4 averaged metrics — use mean across days where data exists (simple)
  const meanOf = (rows: DailyRow[]): number => {
    if (rows.length === 0) return 0;
    return rows.reduce((s, r) => s + (r.values[0] ?? 0), 0) / rows.length;
  };

  const bounceRate = meanOf(bounceDaily);
  const bounceRatePrev = meanOf(bouncePrevDaily);
  const avgDuration = meanOf(durDaily);
  const avgDurationPrev = meanOf(durPrevDaily);

  const aiTotal = sumIndex(aiDaily, 0);
  const aiTotalPrev = sumIndex(aiPrevDaily, 0);
  const directTotal = sumIndex(directDaily, 0);
  const directTotalPrev = sumIndex(directPrevDaily, 0);
  const eventsTotal = sumIndex(eventsDaily, 0);
  const eventsTotalPrev = sumIndex(eventsPrevDaily, 0);
  const aiEventsTotal = sumIndex(aiEventsDaily, 0);
  const aiEventsTotalPrev = sumIndex(aiEventsPrevDaily, 0);
  const usersTotal = sumIndex(usersDaily, 0);
  const usersTotalPrev = sumIndex(usersPrevDaily, 0);
  const conversionRate = ratio(eventsTotal, usersTotal);
  const conversionRatePrev = ratio(eventsTotalPrev, usersTotalPrev);

  const layer1Totals = [
    { label: "Impressions (Total)", source: "GSC" as const, value: formatBig(totalImpressions), changePercent: pct(totalImpressions, totalImpressionsPrev), data: spark(gAll, 0) },
    { label: "Bounce Rate (Organic Search)", source: "GA4" as const, value: formatPct(bounceRate), changePercent: pct(bounceRate, bounceRatePrev), invertColors: true, data: spark(bounceDaily, 0) },
    { label: "Avg. Session Duration (Organic Search)", source: "GA4" as const, value: formatDuration(avgDuration), changePercent: pct(avgDuration, avgDurationPrev), data: spark(durDaily, 0) },
  ];
  const layer1Branded = [
    { label: "Impressions (Branded)", source: "GSC" as const, value: formatBig(brandedImpressions), changePercent: pct(brandedImpressions, brandedImpressionsPrev), data: spark(gBranded, 0) },
    { label: "Avg. Position (Branded)", source: "GSC" as const, value: brandedPosition > 0 ? brandedPosition.toFixed(1) : "—", changePercent: pct(brandedPosition, brandedPositionPrev), invertColors: true, data: spark(gBranded, 3) },
  ];
  const layer1NonBranded = [
    { label: "Impressions (Non-Branded)", source: "GSC" as const, value: formatBig(nbImpressions), changePercent: pct(nbImpressions, nbImpressionsPrev), data: spark(gNonBranded, 0) },
    { label: "Avg. Position (Non-Branded)", source: "GSC" as const, value: nbPosition > 0 ? nbPosition.toFixed(1) : "—", changePercent: pct(nbPosition, nbPositionPrev), invertColors: true, data: spark(gNonBranded, 3) },
  ];

  const layer2Totals = [
    { label: "Clicks (Total)", source: "GSC" as const, value: formatBig(totalClicks), changePercent: pct(totalClicks, totalClicksPrev), data: spark(gAll, 1) },
    { label: "AI Referral Traffic (Referral medium only)", source: "GA4" as const, value: formatBig(aiTotal), changePercent: pct(aiTotal, aiTotalPrev), data: spark(aiDaily, 0) },
    { label: "Direct Source Traffic", source: "GA4" as const, value: formatBig(directTotal), changePercent: pct(directTotal, directTotalPrev), data: spark(directDaily, 0) },
  ];
  const layer2Branded = [
    { label: "Clicks (Branded)", source: "GSC" as const, value: formatBig(brandedClicks), changePercent: pct(brandedClicks, brandedClicksPrev), data: spark(gBranded, 1) },
    { label: "CTR (Branded)", source: "GSC" as const, value: formatPct(brandedCtr), changePercent: pct(brandedCtr, brandedCtrPrev), data: spark(gBranded, 2) },
  ];
  const layer2NonBranded = [
    { label: "Clicks (Non-Branded)", source: "GSC" as const, value: formatBig(nbClicks), changePercent: pct(nbClicks, nbClicksPrev), data: spark(gNonBranded, 1) },
    { label: "CTR (Non-Branded)", source: "GSC" as const, value: formatPct(nbCtr), changePercent: pct(nbCtr, nbCtrPrev), data: spark(gNonBranded, 2) },
  ];

  const eventLabel = conversionEvents.length > 0 ? `${conversionEvents.length} selected` : "all";
  const layer3Cards = [
    { label: `Organic Conversions (Events: ${eventLabel})`, source: "GA4" as const, value: formatBig(eventsTotal), changePercent: pct(eventsTotal, eventsTotalPrev), data: spark(eventsDaily, 0) },
    { label: `AI Referral Conversions (Events: ${eventLabel})`, source: "GA4" as const, value: formatBig(aiEventsTotal), changePercent: pct(aiEventsTotal, aiEventsTotalPrev), data: spark(aiEventsDaily, 0) },
    { label: "Conversion Rate (Events / Users)", source: "GA4" as const, value: formatPct(conversionRate, 2), changePercent: pct(conversionRate, conversionRatePrev), data: spark(eventsDaily, 0) },
  ];

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
        currentSites={siteUrls}
        currentProperties={propertyIds}
        currentDays={computedDays}
        currentStart={range.startDate}
        currentEnd={range.endDate}
        currentBranded={brandedTerms}
        currentEvents={conversionEvents}
        eventOptions={eventOptions}
      />

      {fetchError && (
        <div className="max-w-[1400px] mx-auto px-6 mt-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {brandedTerms.length === 0 && (
        <div className="max-w-[1400px] mx-auto px-6 mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800">
          Add branded terms above to populate Branded / Non-Branded metrics.
        </div>
      )}

      {/* Layer #1 */}
      <section className="max-w-[1400px] mx-auto px-6 mt-8">
        <div className="mb-3 border-b border-gray-300 pb-2">
          <h2 className="text-2xl text-gray-900">Layer #1: Leading Indicators</h2>
          <p className="text-sm text-gray-500 not-italic">Ranged objectives based on historical trends and industry data.</p>
        </div>
        {brandedTerms.length > 0 && (
          <div className="mb-4">
            <BrandedComparison
              brandedImpressions={brandedImpressions}
              nbImpressions={nbImpressions}
              brandedClicks={brandedClicks}
              nbClicks={nbClicks}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {layer1Totals.map((c) => <OverviewMetricCard key={c.label} {...c} />)}
        </div>
        {brandedTerms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-base text-gray-700 mb-2 not-italic font-semibold">Branded</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {layer1Branded.map((c) => <OverviewMetricCard key={c.label} {...c} />)}
              </div>
            </div>
            <div>
              <h3 className="text-base text-gray-700 mb-2 not-italic font-semibold">Non-Branded</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {layer1NonBranded.map((c) => <OverviewMetricCard key={c.label} {...c} />)}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Layer #2 */}
      <section className="max-w-[1400px] mx-auto px-6 mt-8">
        <div className="mb-3 border-b border-gray-300 pb-2">
          <h2 className="text-2xl text-gray-900">Layer #2: Outcome Ranges</h2>
          <p className="text-sm text-gray-500 not-italic">Broad outcomes to continue to refine and track based on wide-factor results.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {layer2Totals.map((c) => <OverviewMetricCard key={c.label} {...c} />)}
        </div>
        {brandedTerms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-base text-gray-700 mb-2 not-italic font-semibold">Branded</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {layer2Branded.map((c) => <OverviewMetricCard key={c.label} {...c} />)}
              </div>
            </div>
            <div>
              <h3 className="text-base text-gray-700 mb-2 not-italic font-semibold">Non-Branded</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {layer2NonBranded.map((c) => <OverviewMetricCard key={c.label} {...c} />)}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Layer #3 — GA4 only, no branded/non-branded split */}
      <section className="max-w-[1400px] mx-auto px-6 mt-8">
        <div className="mb-3 border-b border-gray-300 pb-2">
          <h2 className="text-2xl text-gray-900">Layer #3: Business Validation</h2>
          <p className="text-sm text-gray-500 not-italic">Ultimate objectives to validate success and opportunity after designated time ranges.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {layer3Cards.map((c) => <OverviewMetricCard key={c.label} {...c} />)}
        </div>
      </section>

      <PresentationFooter generatedAt={new Date()} />
    </main>
  );
}
