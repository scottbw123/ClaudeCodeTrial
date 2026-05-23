import type { Ga4Row } from "@/lib/ga4";

function fmtInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function Ga4Tables({
  trafficSources,
  events,
  pagePerformance,
}: {
  trafficSources: Ga4Row[];
  events: Ga4Row[];
  pagePerformance: Ga4Row[];
}) {
  return (
    <section className="max-w-[1400px] mx-auto px-6 mt-8 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-xl font-bold text-gray-900">Traffic Sources</h3>
          <p className="text-sm text-gray-500">By channel and source/medium — acquisition, behavior, conversions.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black text-white text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Channel</th>
                <th className="px-3 py-2 text-left font-semibold">Source / Medium</th>
                <th className="px-3 py-2 text-right font-semibold">Sessions</th>
                <th className="px-3 py-2 text-right font-semibold">Users</th>
                <th className="px-3 py-2 text-right font-semibold">Bounce Rate</th>
                <th className="px-3 py-2 text-right font-semibold">Avg. Session</th>
                <th className="px-3 py-2 text-right font-semibold">Pages / Session</th>
                <th className="px-3 py-2 text-right font-semibold">Key Events</th>
              </tr>
            </thead>
            <tbody>
              {trafficSources.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">No data</td></tr>
              )}
              {trafficSources.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-1.5 font-medium">{r.dimensionValues[0]}</td>
                  <td className="px-3 py-1.5 text-gray-700">{r.dimensionValues[1]}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[0]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[1]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtPct(Number(r.metricValues[2]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtDuration(Number(r.metricValues[3]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{Number(r.metricValues[4]).toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[5]))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-xl font-bold text-gray-900">Events</h3>
          <p className="text-sm text-gray-500">All event activity, ranked by count.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black text-white text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Event Name</th>
                <th className="px-3 py-2 text-center font-semibold">Key Event?</th>
                <th className="px-3 py-2 text-right font-semibold">Count</th>
                <th className="px-3 py-2 text-right font-semibold">Users</th>
                <th className="px-3 py-2 text-right font-semibold">Per User</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No data</td></tr>
              )}
              {events.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-1.5 font-medium">{r.dimensionValues[0]}</td>
                  <td className="px-3 py-1.5 text-center">
                    {r.dimensionValues[1] === "true" ? (
                      <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">KEY</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[0]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[1]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{Number(r.metricValues[2]).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-xl font-bold text-gray-900">Page Performance</h3>
          <p className="text-sm text-gray-500">Per-page views, sessions, events and key events.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black text-white text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Page Path</th>
                <th className="px-3 py-2 text-right font-semibold">Views</th>
                <th className="px-3 py-2 text-right font-semibold">Users</th>
                <th className="px-3 py-2 text-right font-semibold">Sessions</th>
                <th className="px-3 py-2 text-right font-semibold">Events</th>
                <th className="px-3 py-2 text-right font-semibold">Key Events</th>
              </tr>
            </thead>
            <tbody>
              {pagePerformance.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No data</td></tr>
              )}
              {pagePerformance.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-1.5 text-gray-900 max-w-[460px] truncate">{r.dimensionValues[0]}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[0]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[1]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[2]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[3]))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(Number(r.metricValues[4]))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
