"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartBox } from "../components/ChartBox";

export interface Sparkpoint {
  date: string;
  value: number;
}

export function OverviewMetricCard({
  label,
  source,
  value,
  changePercent,
  invertColors,
  data,
}: {
  label: string;
  source: "GSC" | "GA4";
  value: string;
  changePercent: number;
  invertColors?: boolean;
  data: Sparkpoint[];
}) {
  const positive = invertColors ? changePercent < 0 : changePercent > 0;
  const negative = invertColors ? changePercent > 0 : changePercent < 0;
  const color = positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-gray-400";
  const stroke = positive ? "#059669" : negative ? "#e11d48" : "#1d4ed8";
  const arrow = changePercent > 0 ? "▲" : changePercent < 0 ? "▼" : "·";

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-600 leading-tight">{label}</p>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${source === "GSC" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
          {source}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className={`text-xs font-medium mt-1 ${color}`}>
        {arrow} {isFinite(changePercent) ? Math.abs(changePercent * 100).toFixed(1) : "0.0"}%
      </p>
      <ChartBox className="h-16 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${label.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.2} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide reversed={invertColors} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 6 }}
              formatter={(v) => Number(v).toLocaleString()}
              labelFormatter={(d) => String(d)}
            />
            <Area type="monotone" dataKey="value" stroke={stroke} strokeWidth={1.5} fill={`url(#grad-${label.replace(/[^a-zA-Z0-9]/g, "")})`} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}
