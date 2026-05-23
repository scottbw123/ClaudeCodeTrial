"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PropertiesResponse } from "../api/reports/properties/route";
import type { GscQueriesResponse } from "../api/reports/gsc/queries/route";
import type { Ga4OverviewResponse } from "../api/reports/ga4/overview/route";

type Preset = "30d" | "90d" | "240d";

const PRESETS: { id: Preset; label: string; days: number }[] = [
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "240d", label: "Last 8 months", days: 240 },
];

function dateRangeFor(preset: Preset): { startDate: string; endDate: string } {
  const days = PRESETS.find((p) => p.id === preset)!.days;
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function formatPercent(n: number, digits = 2): string {
  return `${(n * 100).toFixed(digits)}%`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [props, setProps] = useState<PropertiesResponse | null>(null);
  const [propsError, setPropsError] = useState<string | null>(null);

  const [siteUrl, setSiteUrl] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [preset, setPreset] = useState<Preset>("30d");

  const range = useMemo(() => dateRangeFor(preset), [preset]);

  const [gsc, setGsc] = useState<GscQueriesResponse | null>(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscError, setGscError] = useState<string | null>(null);

  const [ga4, setGa4] = useState<Ga4OverviewResponse | null>(null);
  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4Error, setGa4Error] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports/properties")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Failed to load properties");
        return json as PropertiesResponse;
      })
      .then((data) => {
        setProps(data);
        if (data.gscSites[0]) setSiteUrl(data.gscSites[0].siteUrl);
        if (data.ga4Properties[0]) setPropertyId(data.ga4Properties[0].propertyId);
      })
      .catch((e) => setPropsError(e.message));
  }, []);

  useEffect(() => {
    if (!siteUrl) return;
    setGscLoading(true);
    setGscError(null);
    const params = new URLSearchParams({ siteUrl, startDate: range.startDate, endDate: range.endDate });
    fetch(`/api/reports/gsc/queries?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "GSC query failed");
        return json as GscQueriesResponse;
      })
      .then(setGsc)
      .catch((e) => setGscError(e.message))
      .finally(() => setGscLoading(false));
  }, [siteUrl, range.startDate, range.endDate]);

  useEffect(() => {
    if (!propertyId) return;
    setGa4Loading(true);
    setGa4Error(null);
    const params = new URLSearchParams({ propertyId, startDate: range.startDate, endDate: range.endDate });
    fetch(`/api/reports/ga4/overview?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "GA4 query failed");
        return json as Ga4OverviewResponse;
      })
      .then(setGa4)
      .catch((e) => setGa4Error(e.message))
      .finally(() => setGa4Loading(false));
  }, [propertyId, range.startDate, range.endDate]);

  return (
    <main className="min-h-full bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            GSC + GA4 performance — {range.startDate} to {range.endDate}
          </p>
        </header>

        {propsError && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Could not load properties: {propsError}
          </div>
        )}

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-8 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Search Console site</label>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white min-w-[260px]"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              disabled={!props}
            >
              {!props && <option>Loading…</option>}
              {props?.gscSites.map((s) => (
                <option key={s.siteUrl} value={s.siteUrl}>
                  {s.siteUrl}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">GA4 property</label>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white min-w-[260px]"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              disabled={!props}
            >
              {!props && <option>Loading…</option>}
              {props?.ga4Properties.map((p) => (
                <option key={p.propertyId} value={p.propertyId}>
                  {p.accountName} — {p.propertyName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Date range</label>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`px-3 py-2 text-sm ${
                    preset === p.id ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Search Console</h2>

          {gscError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {gscError}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MetricCard
              label="Clicks"
              value={gsc ? formatNumber(gsc.totals.clicks) : gscLoading ? "…" : "—"}
            />
            <MetricCard
              label="Impressions"
              value={gsc ? formatNumber(gsc.totals.impressions) : gscLoading ? "…" : "—"}
            />
            <MetricCard
              label="CTR"
              value={gsc ? formatPercent(gsc.totals.ctr) : gscLoading ? "…" : "—"}
            />
            <MetricCard
              label="Avg. position"
              value={gsc ? gsc.totals.position.toFixed(1) : gscLoading ? "…" : "—"}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top queries</p>
              <p className="text-xs text-gray-400">{gsc?.rows.length ?? 0} rows</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-400 bg-gray-50">
                  <tr>
                    <th className="px-5 py-2 text-left font-medium">Query</th>
                    <th className="px-5 py-2 text-right font-medium">Clicks</th>
                    <th className="px-5 py-2 text-right font-medium">Impressions</th>
                    <th className="px-5 py-2 text-right font-medium">CTR</th>
                    <th className="px-5 py-2 text-right font-medium">Avg. position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gscLoading && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-gray-400">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!gscLoading && gsc?.rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-gray-400">
                        No data for this site / date range.
                      </td>
                    </tr>
                  )}
                  {gsc?.rows.slice(0, 50).map((r) => (
                    <tr key={r.query} className="hover:bg-gray-50">
                      <td className="px-5 py-2 text-gray-800">{r.query}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{formatNumber(r.clicks)}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{formatNumber(r.impressions)}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{formatPercent(r.ctr)}</td>
                      <td className="px-5 py-2 text-right tabular-nums">{r.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {gsc && gsc.rows.length > 50 && (
              <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                Showing first 50 of {gsc.rows.length}.
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Google Analytics 4</h2>

          {ga4Error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {ga4Error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <MetricCard
              label="Users"
              value={ga4 ? formatNumber(ga4.totals.activeUsers) : ga4Loading ? "…" : "—"}
            />
            <MetricCard
              label="Sessions"
              value={ga4 ? formatNumber(ga4.totals.sessions) : ga4Loading ? "…" : "—"}
            />
            <MetricCard
              label="Bounce rate"
              value={ga4 ? formatPercent(ga4.totals.bounceRate) : ga4Loading ? "…" : "—"}
            />
            <MetricCard
              label="Avg session"
              value={ga4 ? formatDuration(ga4.totals.averageSessionDuration) : ga4Loading ? "…" : "—"}
            />
            <MetricCard
              label="Pages / session"
              value={ga4 ? ga4.totals.screenPageViewsPerSession.toFixed(2) : ga4Loading ? "…" : "—"}
            />
            <MetricCard
              label="New users"
              value={ga4 ? formatPercent(ga4.totals.newUserPercent) : ga4Loading ? "…" : "—"}
              sub={ga4 ? `${formatNumber(ga4.totals.newUsers)} of ${formatNumber(ga4.totals.activeUsers)}` : undefined}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Traffic acquisition over time
            </p>
            <div className="h-72">
              {ga4Loading && (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  Loading…
                </div>
              )}
              {!ga4Loading && ga4 && ga4.series.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ga4.series} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                    <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="activeUsers" stroke="#059669" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="newUsers" stroke="#d97706" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {!ga4Loading && ga4 && ga4.series.length === 0 && (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No data for this property / date range.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
