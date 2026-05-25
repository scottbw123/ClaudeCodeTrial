"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ComposableMap, Geographies, Geography, Sphere } from "react-simple-maps";
import { ALPHA3_TO_NUMERIC } from "./country-codes";
import { TableExport } from "../components/TableExport";

const TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const DEVICE_COLORS: Record<string, string> = {
  DESKTOP: "#1d4ed8",
  MOBILE: "#06b6d4",
  TABLET: "#ec4899",
};

function formatInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function Delta({ change, invert }: { change: number; invert?: boolean }) {
  if (!isFinite(change) || change === 0) return <span className="text-xs text-gray-400">—</span>;
  const positive = invert ? change < 0 : change > 0;
  const color = positive ? "text-emerald-600" : "text-rose-600";
  const arrow = change > 0 ? "▲" : "▼";
  return (
    <span className={`text-xs font-medium ${color} tabular-nums`}>
      {arrow} {Math.abs(change * 100).toFixed(1)}%
    </span>
  );
}

export interface DeviceRow {
  device: string;
  impressions: number;
  clicks: number;
  rank: number;
  ctr: number;
  impressionsChange: number;
  clicksChange: number;
  rankChange: number;
  ctrChange: number;
}

export interface CountryRow {
  code: string;
  name: string;
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
}

export function DemographicsSection({
  devices,
  countries,
  totals,
}: {
  devices: DeviceRow[];
  countries: CountryRow[];
  totals: { impressions: number; clicks: number; position: number; ctr: number; impressionsChange: number; clicksChange: number; rankChange: number; ctrChange: number };
}) {
  const deviceImpressions = devices.reduce((s, d) => s + d.impressions, 0) || 1;

  const countryByNumeric = new Map<string, CountryRow>();
  for (const c of countries) {
    const numeric = ALPHA3_TO_NUMERIC[c.code.toUpperCase()];
    if (numeric) countryByNumeric.set(numeric, c);
  }
  const maxImpressions = Math.max(...countries.map((c) => c.impressions), 1);

  function colorFor(numericId: string): string {
    const row = countryByNumeric.get(numericId);
    if (!row) return "#f3f4f6";
    const intensity = Math.min(1, row.impressions / maxImpressions);
    const lightness = 95 - intensity * 50;
    return `hsl(258, 90%, ${lightness}%)`;
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">Search Demographics</h3>
        <p className="text-sm text-gray-500">Tracks all users to measure overall website traffic.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TableExport title="Search Demographics — Devices">
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-sm">
              <thead className="bg-black text-white text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Device</th>
                  <th className="px-3 py-2 text-right font-semibold">Impressions</th>
                  <th className="px-3 py-2 text-right font-semibold">% Δ</th>
                  <th className="px-3 py-2 text-right font-semibold">Clicks</th>
                  <th className="px-3 py-2 text-right font-semibold">% Δ</th>
                  <th className="px-3 py-2 text-right font-semibold">Rank</th>
                  <th className="px-3 py-2 text-right font-semibold">% Δ</th>
                  <th className="px-3 py-2 text-right font-semibold">CTR</th>
                  <th className="px-3 py-2 text-right font-semibold">% Δ</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d, i) => (
                  <tr key={d.device} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-1.5 font-medium">{d.device}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatInt(d.impressions)}</td>
                    <td className="px-3 py-1.5 text-right"><Delta change={d.impressionsChange} /></td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatInt(d.clicks)}</td>
                    <td className="px-3 py-1.5 text-right"><Delta change={d.clicksChange} /></td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{d.rank.toFixed(0)}</td>
                    <td className="px-3 py-1.5 text-right"><Delta change={d.rankChange} invert /></td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatPct(d.ctr)}</td>
                    <td className="px-3 py-1.5 text-right"><Delta change={d.ctrChange} /></td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 font-semibold">
                  <td className="px-3 py-2">Grand total</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatInt(totals.impressions)}</td>
                  <td className="px-3 py-2 text-right"><Delta change={totals.impressionsChange} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatInt(totals.clicks)}</td>
                  <td className="px-3 py-2 text-right"><Delta change={totals.clicksChange} /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{totals.position.toFixed(0)}</td>
                  <td className="px-3 py-2 text-right"><Delta change={totals.rankChange} invert /></td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatPct(totals.ctr)}</td>
                  <td className="px-3 py-2 text-right"><Delta change={totals.ctrChange} /></td>
                </tr>
              </tbody>
            </table>
          </div>
          </TableExport>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={devices.map((d) => ({ name: d.device, value: d.impressions, pct: d.impressions / deviceImpressions }))}
                  dataKey="value"
                  cx="40%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label={(entry: unknown) => {
                    const pct = (entry as { pct?: number }).pct ?? 0;
                    return `${(pct * 100).toFixed(1)}%`;
                  }}
                  labelLine={false}
                >
                  {devices.map((d) => (
                    <Cell key={d.device} fill={DEVICE_COLORS[d.device] ?? "#a3a3a3"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatInt(Number(v))} />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: 16 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <TableExport title="Search Demographics — Countries">
          <div className="overflow-x-auto max-h-72">
            <table className="min-w-full text-sm">
              <thead className="bg-black text-white text-xs sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Country</th>
                  <th className="px-3 py-2 text-right font-semibold">Impressions</th>
                  <th className="px-3 py-2 text-right font-semibold">Clicks</th>
                  <th className="px-3 py-2 text-right font-semibold">Avg. Position</th>
                  <th className="px-3 py-2 text-right font-semibold">CTR</th>
                </tr>
              </thead>
              <tbody>
                {countries.slice(0, 30).map((c, i) => (
                  <tr key={c.code} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-1.5 text-gray-500">{i + 1}.</td>
                    <td className="px-3 py-1.5 font-medium">{c.name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatInt(c.impressions)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatInt(c.clicks)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{c.position.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatPct(c.ctr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </TableExport>
          <div className="mt-4 overflow-hidden">
            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 150, center: [0, 10] }}
              width={800}
              height={400}
              style={{ width: "100%", height: "auto" }}
            >
              <Sphere id="sphere" stroke="#e5e7eb" strokeWidth={0.5} fill="transparent" />
              <Geographies geography={TOPOJSON_URL}>
                {({ geographies }: { geographies: { rsmKey: string; id: string }[] }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={colorFor(geo.id)}
                      stroke="#e5e7eb"
                      strokeWidth={0.3}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#6d28d9" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>
      </div>
    </section>
  );
}
