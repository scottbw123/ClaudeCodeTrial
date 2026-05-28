"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartBox } from "../components/ChartBox";

export interface MetricSectionData {
  title: string;
  description: string;
  series: { date: string; value: number }[];
  invertColors?: boolean;
  format: "int" | "percent" | "decimal";
  callouts: {
    label: string;
    total: number;
    changePercent: number;
    bars: { date: string; value: number }[];
  }[];
}

function format(n: number, kind: "int" | "percent" | "decimal"): string {
  if (kind === "percent") return `${(n * 100).toFixed(2)}%`;
  if (kind === "decimal") return n.toFixed(1);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function deltaColor(change: number, invert: boolean | undefined): string {
  const positive = invert ? change < 0 : change > 0;
  const negative = invert ? change > 0 : change < 0;
  if (positive) return "text-emerald-600";
  if (negative) return "text-rose-600";
  return "text-gray-400";
}

function trendLine(points: { date: string; value: number }[]): { date: string; value: number; trend: number }[] {
  if (points.length === 0) return [];
  const n = points.length;
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.value);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0) || 1;
  const slope = num / den;
  const intercept = meanY - slope * meanX;
  return points.map((p, i) => ({ ...p, trend: intercept + slope * i }));
}

export function MetricSection({ data }: { data: MetricSectionData }) {
  const series = trendLine(data.series);

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-xl font-bold text-gray-900">{data.title}</h3>
        <p className="text-sm text-gray-500">{data.description}</p>
      </div>

      <ChartBox className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} minTickGap={32} />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(v) => format(v, data.format)}
              reversed={data.invertColors}
              width={48}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
              formatter={(v) => format(Number(v), data.format)}
            />
            <Line type="monotone" dataKey="value" stroke="#000" strokeWidth={1.75} dot={false} />
            <Line type="monotone" dataKey="trend" stroke="#a78bfa" strokeWidth={1} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {data.callouts.map((c) => {
          const arrow = c.changePercent > 0 ? "▲" : c.changePercent < 0 ? "▼" : "·";
          return (
            <div key={c.label} className="bg-white border border-gray-200 rounded-md p-3">
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                {format(c.total, data.format)}
              </p>
              <p className={`text-xs font-medium ${deltaColor(c.changePercent, data.invertColors)}`}>
                {arrow} {Math.abs(c.changePercent * 100).toFixed(1)}%
              </p>
              <ChartBox className="h-10 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={c.bars} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          );
        })}
      </div>
    </section>
  );
}
