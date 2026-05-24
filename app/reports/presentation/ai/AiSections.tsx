"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colorForAiSource } from "@/lib/ai-sources";

function trendLine(points: { date: string; value: number }[]) {
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

export function SessionsLineChart({ data }: { data: { date: string; value: number }[] }) {
  const series = trendLine(data);
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} minTickGap={32} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} width={36} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={1.75} dot={false} />
          <Line type="monotone" dataKey="trend" stroke="#d1d5db" strokeWidth={1} dot={false} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopSourcesDonut({
  data,
  totalLabel,
  totalValue,
  totalChange,
}: {
  data: { name: string; value: number }[];
  totalLabel: string;
  totalValue: number;
  totalChange: number;
}) {
  const sum = data.reduce((s, d) => s + d.value, 0) || 1;
  const arrow = totalChange > 0 ? "▲" : totalChange < 0 ? "▼" : "·";
  const color = totalChange > 0 ? "text-emerald-600" : totalChange < 0 ? "text-rose-600" : "text-gray-400";

  const renderInsideLabel = (props: unknown) => {
    const p = props as { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number };
    if (p.percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = p.innerRadius + (p.outerRadius - p.innerRadius) * 0.55;
    const x = p.cx + radius * Math.cos(-p.midAngle * RADIAN);
    const y = p.cy + radius * Math.sin(-p.midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="600">
        {(p.percent * 100).toFixed(1)}%
      </text>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <h3 className="text-center text-lg font-bold mb-2">Top Sources</h3>
      <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
        <div className="h-72 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.map((d) => ({ ...d, pct: d.value / sum }))}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={110}
                label={renderInsideLabel}
                labelLine={false}
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={colorForAiSource(d.name)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => new Intl.NumberFormat("en-US").format(Number(v))}
                contentStyle={{
                  background: "rgba(17, 24, 39, 0.95)",
                  border: "none",
                  color: "#fff",
                  fontSize: 11,
                  padding: "6px 10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
                cursor={false}
                position={{ x: 0, y: -8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{totalLabel}</p>
            <p className="text-2xl font-bold tabular-nums">{new Intl.NumberFormat("en-US").format(totalValue)}</p>
            <p className={`text-xs font-medium ${color}`}>{arrow} {Math.abs(totalChange * 100).toFixed(1)}%</p>
          </div>
        </div>
        <ul className="text-xs space-y-1 pr-2">
          {data.map((d) => (
            <li key={d.name} className="flex items-center gap-2 whitespace-nowrap">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: colorForAiSource(d.name) }} />
              <span className="text-gray-700">{d.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function StackedBarBySource({
  data,
  sources,
}: {
  data: Array<Record<string, number | string>>;
  sources: string[];
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 30, left: 0 }}>
          <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-25} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} width={36} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, maxWidth: 280 }} wrapperStyle={{ zIndex: 50 }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} verticalAlign="top" />
          {sources.map((s) => (
            <Bar key={s} dataKey={s} stackId="a" fill={colorForAiSource(s)} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const EVENT_COLORS = [
  "#7c3aed", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#3b82f6",
  "#a855f7", "#ef4444", "#84cc16", "#f97316", "#0ea5e9", "#d946ef",
];

export function StackedBarByEvent({
  data,
  events,
}: {
  data: Array<Record<string, number | string>>;
  events: string[];
}) {
  return (
    <div className="h-[420px] flex flex-col">
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-0.5 text-[10px] text-gray-700 mb-2 max-h-24 overflow-y-auto">
        {events.map((e, i) => (
          <li key={e} className="flex items-center gap-1.5 truncate" title={e}>
            <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ background: EVENT_COLORS[i % EVENT_COLORS.length] }} />
            <span className="truncate">{e}</span>
          </li>
        ))}
      </ul>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 30, left: 0 }}>
            <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-25} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} width={36} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, maxWidth: 280, maxHeight: 320, overflow: "auto" }} wrapperStyle={{ zIndex: 50 }} />
            {events.map((e, i) => (
              <Bar key={e} dataKey={e} stackId="a" fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  changePercent,
  invertColors,
}: {
  label: string;
  value: string;
  changePercent: number | null;
  invertColors?: boolean;
}) {
  let changeNode: React.ReactNode = <span className="text-xs text-gray-400">N/A</span>;
  if (changePercent !== null && isFinite(changePercent)) {
    const positive = invertColors ? changePercent < 0 : changePercent > 0;
    const negative = invertColors ? changePercent > 0 : changePercent < 0;
    const color = positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-gray-400";
    const arrow = changePercent > 0 ? "▲" : changePercent < 0 ? "▼" : "·";
    changeNode = (
      <span className={`text-xs font-medium ${color}`}>
        {arrow} {Math.abs(changePercent * 100).toFixed(1)}%
      </span>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
      <p className="mt-1">{changeNode}</p>
    </div>
  );
}
