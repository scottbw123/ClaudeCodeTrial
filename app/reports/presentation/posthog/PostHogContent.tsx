import { listPosthogProjects, runHogQLMultiProject, listRecordings, type HogQLResult } from "@/lib/posthog";
import { previousPeriod, rangeFromDays, daysBetween } from "@/lib/date-utils";
import { PresentationHeader } from "../components/Header";
import { PresentationFooter } from "../components/Footer";
import { UrlCell } from "../components/UrlCell";
import { TableExport } from "../components/TableExport";
import { PostHogControls } from "./Controls";
import { SessionsLineChart, StatCard } from "../ai/AiSections";

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
  if (!isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function formatDuration(s: number): string {
  if (!isFinite(s) || s < 0) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec.toString().padStart(2, "0")}s`;
}

function quote(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function inListSql(field: string, values: string[]): string {
  return `${field} IN (${values.map(quote).join(",")})`;
}

export async function PostHogContent({ searchParams: sp, overviewHref, gscHref, ga4Href, aiHref, posthogHref }: Props) {
  let projects: Awaited<ReturnType<typeof listPosthogProjects>> = [];
  let setupError: string | null = null;
  try {
    projects = await listPosthogProjects();
  } catch (err) {
    setupError = err instanceof Error ? err.message : String(err);
  }

  const projectIds = (sp.projectId || projects[0]?.projectId || "").split(",").map((s) => s.trim()).filter(Boolean);

  const hasCustom = Boolean(sp.start && sp.end);
  const days = Number(sp.days || 30);
  const range = hasCustom ? { startDate: sp.start!, endDate: sp.end! } : rangeFromDays(days);
  const computedDays = daysBetween(range.startDate, range.endDate);
  const compareRange = previousPeriod(range.startDate, range.endDate);

  const eventNames = (sp.eventName || "").split(",").map((s) => s.trim()).filter(Boolean);
  const funnelStart = (sp.funnelStart || "").trim();
  const funnelEnd = (sp.funnelEnd || "").trim();

  const eventClause = eventNames.length > 0 ? ` AND ${inListSql("event", eventNames)}` : "";
  const startD = quote(range.startDate);
  const endD = quote(range.endDate);
  const prevStartD = quote(compareRange.startDate);
  const prevEndD = quote(compareRange.endDate);

  let dailySessions: { date: string; value: number }[] = [];
  let topEvents: { name: string; count: number; users: number }[] = [];
  let topPages: { url: string; views: number; users: number }[] = [];
  let topSources: { source: string; sessions: number }[] = [];
  let topAutocapture: { selector: string; clicks: number }[] = [];
  let conversionRows: { name: string; count: number; users: number; prevCount: number }[] = [];
  let funnelStep1 = 0, funnelStep2 = 0;
  let totalSessions = 0, totalSessionsPrev = 0;
  let totalUsers = 0, totalUsersPrev = 0;
  let totalEvents = 0, totalEventsPrev = 0;
  let recordings: Awaited<ReturnType<typeof listRecordings>> = [];
  let eventOptions: string[] = [];
  let fetchError: string | null = null;

  if (projectIds.length > 0 && !setupError) {
    try {
      const [
        sessionsTs,
        totalsCur,
        totalsPrev,
        eventsRows,
        pagesRows,
        sourcesRows,
        autocaptureRows,
        eventOptsRows,
        recsResult,
        funnelRes,
        conversionsCur,
        conversionsPrev,
      ] = await Promise.all([
        runHogQLMultiProject({
          projectIds,
          query: `SELECT toString(toDate(timestamp)) AS d, count(DISTINCT $session_id) AS sessions
                  FROM events
                  WHERE timestamp >= ${startD} AND timestamp <= ${endD}${eventClause}
                  GROUP BY d ORDER BY d ASC`,
        }),
        runHogQLMultiProject({
          projectIds,
          query: `SELECT count(DISTINCT $session_id), count(DISTINCT person_id), count()
                  FROM events
                  WHERE timestamp >= ${startD} AND timestamp <= ${endD}${eventClause}`,
        }),
        runHogQLMultiProject({
          projectIds,
          query: `SELECT count(DISTINCT $session_id), count(DISTINCT person_id), count()
                  FROM events
                  WHERE timestamp >= ${prevStartD} AND timestamp <= ${prevEndD}${eventClause}`,
        }),
        runHogQLMultiProject({
          projectIds,
          query: `SELECT event, count() AS c, count(DISTINCT person_id) AS u
                  FROM events
                  WHERE timestamp >= ${startD} AND timestamp <= ${endD}${eventClause}
                  GROUP BY event ORDER BY c DESC LIMIT 25`,
        }),
        runHogQLMultiProject({
          projectIds,
          query: `SELECT properties.$current_url AS url, count() AS views, count(DISTINCT person_id) AS users
                  FROM events
                  WHERE event = '$pageview' AND timestamp >= ${startD} AND timestamp <= ${endD}
                    AND notEmpty(properties.$current_url)
                  GROUP BY url ORDER BY views DESC LIMIT 25`,
        }),
        runHogQLMultiProject({
          projectIds,
          query: `SELECT coalesce(nullIf(properties.$initial_utm_source, ''),
                                  nullIf(properties.$initial_referring_domain, ''),
                                  'direct') AS src,
                         count(DISTINCT $session_id) AS sessions
                  FROM events
                  WHERE timestamp >= ${startD} AND timestamp <= ${endD}
                  GROUP BY src ORDER BY sessions DESC LIMIT 15`,
        }),
        runHogQLMultiProject({
          projectIds,
          query: `SELECT concat(coalesce(properties.$el_text, ''), ' [', coalesce(properties.$elements_chain_tag, ''), ']') AS sel,
                         count() AS clicks
                  FROM events
                  WHERE event = '$autocapture' AND timestamp >= ${startD} AND timestamp <= ${endD}
                  GROUP BY sel ORDER BY clicks DESC LIMIT 15`,
        }),
        runHogQLMultiProject({
          projectIds,
          query: `SELECT event, count() FROM events
                  WHERE timestamp >= ${startD} AND timestamp <= ${endD}
                  GROUP BY event ORDER BY count() DESC LIMIT 500`,
        }),
        projectIds.length === 1
          ? listRecordings({ projectId: projectIds[0], startDate: range.startDate, endDate: range.endDate, limit: 20 })
              .catch(() => [])
          : Promise.resolve([] as Awaited<ReturnType<typeof listRecordings>>),
        funnelStart && funnelEnd
          ? runHogQLMultiProject({
              projectIds,
              query: `WITH starters AS (
                        SELECT DISTINCT person_id, min(timestamp) AS t0
                        FROM events
                        WHERE event = ${quote(funnelStart)} AND timestamp >= ${startD} AND timestamp <= ${endD}
                        GROUP BY person_id
                      ),
                      finishers AS (
                        SELECT DISTINCT s.person_id
                        FROM starters s
                        JOIN events e ON e.person_id = s.person_id
                        WHERE e.event = ${quote(funnelEnd)} AND e.timestamp >= s.t0 AND e.timestamp <= ${endD}
                      )
                      SELECT (SELECT count() FROM starters), (SELECT count() FROM finishers)`,
            })
          : Promise.resolve({ columns: [], results: [] } as HogQLResult),
        eventNames.length > 0
          ? runHogQLMultiProject({
              projectIds,
              query: `SELECT event, count() AS c, count(DISTINCT person_id) AS u
                      FROM events
                      WHERE timestamp >= ${startD} AND timestamp <= ${endD} AND ${inListSql("event", eventNames)}
                      GROUP BY event ORDER BY c DESC`,
            })
          : Promise.resolve({ columns: [], results: [] } as HogQLResult),
        eventNames.length > 0
          ? runHogQLMultiProject({
              projectIds,
              query: `SELECT event, count() AS c
                      FROM events
                      WHERE timestamp >= ${prevStartD} AND timestamp <= ${prevEndD} AND ${inListSql("event", eventNames)}
                      GROUP BY event`,
            })
          : Promise.resolve({ columns: [], results: [] } as HogQLResult),
      ]);

      dailySessions = sessionsTs.results.map((r) => ({ date: String(r[0] ?? ""), value: Number(r[1] ?? 0) }));
      totalSessions = Number(totalsCur.results[0]?.[0] ?? 0);
      totalUsers = Number(totalsCur.results[0]?.[1] ?? 0);
      totalEvents = Number(totalsCur.results[0]?.[2] ?? 0);
      totalSessionsPrev = Number(totalsPrev.results[0]?.[0] ?? 0);
      totalUsersPrev = Number(totalsPrev.results[0]?.[1] ?? 0);
      totalEventsPrev = Number(totalsPrev.results[0]?.[2] ?? 0);

      topEvents = eventsRows.results.map((r) => ({ name: String(r[0] ?? ""), count: Number(r[1] ?? 0), users: Number(r[2] ?? 0) }));
      topPages = pagesRows.results.map((r) => ({ url: String(r[0] ?? ""), views: Number(r[1] ?? 0), users: Number(r[2] ?? 0) }));
      topSources = sourcesRows.results.map((r) => ({ source: String(r[0] ?? ""), sessions: Number(r[1] ?? 0) }));
      topAutocapture = autocaptureRows.results.map((r) => ({ selector: String(r[0] ?? ""), clicks: Number(r[1] ?? 0) }));
      eventOptions = eventOptsRows.results.map((r) => String(r[0] ?? "")).filter(Boolean);
      recordings = recsResult;

      if (funnelStart && funnelEnd && funnelRes.results[0]) {
        funnelStep1 = Number(funnelRes.results[0][0] ?? 0);
        funnelStep2 = Number(funnelRes.results[0][1] ?? 0);
      }

      const prevByName = new Map<string, number>();
      for (const r of conversionsPrev.results) prevByName.set(String(r[0] ?? ""), Number(r[1] ?? 0));
      conversionRows = conversionsCur.results.map((r) => {
        const name = String(r[0] ?? "");
        return { name, count: Number(r[1] ?? 0), users: Number(r[2] ?? 0), prevCount: prevByName.get(name) ?? 0 };
      });
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  const funnelConversion = funnelStep1 > 0 ? funnelStep2 / funnelStep1 : 0;

  return (
    <>
      <PresentationHeader
        title="PostHog"
        startDate={range.startDate}
        endDate={range.endDate}
        activeTab="posthog"
        overviewHref={overviewHref}
        gscHref={gscHref}
        ga4Href={ga4Href}
        aiHref={aiHref}
        posthogHref={posthogHref}
      />
      <main className="bg-white min-h-screen">
        <PostHogControls
          projects={projects}
          currentProjects={projectIds}
          currentDays={computedDays}
          currentStart={range.startDate}
          currentEnd={range.endDate}
          currentEventNames={eventNames}
          currentFunnelStart={funnelStart}
          currentFunnelEnd={funnelEnd}
          eventOptions={eventOptions}
        />

        {setupError && (
          <div className="max-w-[1400px] mx-auto px-6 mt-6 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            PostHog isn&apos;t configured yet. Add <code className="px-1 bg-amber-100">POSTHOG_PERSONAL_API_KEY</code> and{" "}
            <code className="px-1 bg-amber-100">POSTHOG_HOST</code> to <code className="px-1 bg-amber-100">.env.local</code>,
            then refresh. Detail: {setupError}
          </div>
        )}
        {fetchError && (
          <div className="max-w-[1400px] mx-auto px-6 mt-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        <section className="max-w-[1400px] mx-auto px-6 mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Sessions" value={formatBig(totalSessions)} changePercent={pct(totalSessions, totalSessionsPrev)} />
          <StatCard label="Unique users" value={formatBig(totalUsers)} changePercent={pct(totalUsers, totalUsersPrev)} />
          <StatCard label="Total events" value={formatBig(totalEvents)} changePercent={pct(totalEvents, totalEventsPrev)} />
        </section>

        <section className="max-w-[1400px] mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h3 className="text-xl font-bold text-gray-900">Sessions over time</h3>
            <p className="text-sm text-gray-500 mb-2">Daily unique sessions from PostHog.</p>
            <SessionsLineChart data={dailySessions} />
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <TableExport title="Top Events">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Top Events</h3>
              <div className="max-h-[320px] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-black text-white text-xs sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Event</th>
                      <th className="px-3 py-2 text-right font-semibold">Count</th>
                      <th className="px-3 py-2 text-right font-semibold">Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEvents.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No events</td></tr>}
                    {topEvents.map((e, i) => (
                      <tr key={e.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-1.5 text-gray-500">{i + 1}.</td>
                        <td className="px-3 py-1.5 font-medium">{e.name}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(e.count)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(e.users)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableExport>
          </div>
        </section>

        <section className="max-w-[1400px] mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <TableExport title="Top Pages (PostHog)">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Top Pages</h3>
              <div className="max-h-[360px] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-black text-white text-xs sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">#</th>
                      <th className="px-3 py-2 text-left font-semibold">URL</th>
                      <th className="px-3 py-2 text-right font-semibold">Views</th>
                      <th className="px-3 py-2 text-right font-semibold">Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No pages</td></tr>}
                    {topPages.map((p, i) => (
                      <tr key={p.url} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-1.5 text-gray-500">{i + 1}.</td>
                        <td className="px-3 py-1.5 max-w-[320px]"><UrlCell url={p.url} /></td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(p.views)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(p.users)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableExport>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <TableExport title="Traffic Sources (PostHog)">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Traffic Sources</h3>
              <div className="max-h-[360px] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-black text-white text-xs sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">#</th>
                      <th className="px-3 py-2 text-left font-semibold">Source</th>
                      <th className="px-3 py-2 text-right font-semibold">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSources.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">No sources</td></tr>}
                    {topSources.map((s, i) => (
                      <tr key={s.source} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-1.5 text-gray-500">{i + 1}.</td>
                        <td className="px-3 py-1.5 font-medium">{s.source}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(s.sessions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableExport>
          </div>
        </section>

        {eventNames.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-6 mt-8">
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <TableExport title="Conversion Events (PostHog)">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Conversion Events</h3>
                <div className="max-h-[320px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-black text-white text-xs sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Event</th>
                        <th className="px-3 py-2 text-right font-semibold">Count</th>
                        <th className="px-3 py-2 text-right font-semibold">% Δ</th>
                        <th className="px-3 py-2 text-right font-semibold">Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversionRows.map((r, i) => {
                        const ch = pct(r.count, r.prevCount);
                        return (
                          <tr key={r.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-1.5 font-medium">{r.name}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(r.count)}</td>
                            <td className="px-3 py-1.5 text-right text-xs">
                              <span className={ch > 0 ? "text-emerald-600" : ch < 0 ? "text-rose-600" : "text-gray-400"}>
                                {ch > 0 ? "▲" : ch < 0 ? "▼" : "·"} {Math.abs(ch * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(r.users)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TableExport>
            </div>
          </section>
        )}

        <section className="max-w-[1400px] mx-auto px-6 mt-10 border-t border-gray-200 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">PostHog-only insights</h2>
          <p className="text-sm text-gray-500 mb-4">Funnels, session recordings, and autocapture clicks — the things PostHog measures that GA4 doesn&apos;t.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Funnel</h3>
              {funnelStart && funnelEnd ? (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
                      <p className="text-xs text-gray-500">{funnelStart}</p>
                      <p className="text-2xl font-bold tabular-nums">{formatBig(funnelStep1)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
                      <p className="text-xs text-gray-500">{funnelEnd}</p>
                      <p className="text-2xl font-bold tabular-nums">{formatBig(funnelStep2)}</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 text-center">
                      <p className="text-xs text-indigo-700">Conversion</p>
                      <p className="text-2xl font-bold tabular-nums text-indigo-900">{(funnelConversion * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-md overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, funnelConversion * 100)}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">Pick step 1 and step 2 events above to build a funnel.</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-4">
              <TableExport title="Top Autocapture Clicks">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Top Autocapture Clicks</h3>
                <div className="max-h-[280px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-black text-white text-xs sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Element</th>
                        <th className="px-3 py-2 text-right font-semibold">Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topAutocapture.length === 0 && <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">No autocapture data</td></tr>}
                      {topAutocapture.map((a, i) => (
                        <tr key={`${a.selector}-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-3 py-1.5 max-w-[320px] truncate" title={a.selector}>{a.selector}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{formatBig(a.clicks)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TableExport>
            </div>
          </div>

          <div className="mt-6 bg-white border border-gray-200 rounded-md p-4">
            <TableExport title="Recent Session Recordings">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Recent Session Recordings</h3>
              {projectIds.length > 1 ? (
                <p className="text-sm text-gray-400">Pick a single PostHog project to see recordings.</p>
              ) : (
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-black text-white text-xs sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">When</th>
                        <th className="px-3 py-2 text-left font-semibold">Person</th>
                        <th className="px-3 py-2 text-left font-semibold">Landing URL</th>
                        <th className="px-3 py-2 text-right font-semibold">Duration</th>
                        <th className="px-3 py-2 text-right font-semibold">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordings.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No recordings</td></tr>}
                      {recordings.map((r, i) => (
                        <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-3 py-1.5 text-xs text-gray-600 whitespace-nowrap">
                            {r.startTime ? new Date(r.startTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="px-3 py-1.5 font-medium truncate max-w-[200px]" title={r.personName}>{r.personName}</td>
                          <td className="px-3 py-1.5 max-w-[280px]"><UrlCell url={r.startUrl} /></td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{formatDuration(r.durationSeconds)}</td>
                          <td className="px-3 py-1.5 text-right">
                            <a href={r.viewerUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline text-xs">
                              ↗ Replay
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableExport>
          </div>
        </section>
      </main>
      <PresentationFooter generatedAt={new Date()} />
    </>
  );
}
