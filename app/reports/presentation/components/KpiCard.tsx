"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export interface KpiCardData {
  label: string;
  value: string;
  changePercent: number;
  invertColors?: boolean;
  spark: { date: string; value: number }[];
}

export function KpiCard({ data }: { data: KpiCardData }) {
  const positive = data.invertColors ? data.changePercent < 0 : data.changePercent > 0;
  const negative = data.invertColors ? data.changePercent > 0 : data.changePercent < 0;
  const color = positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-gray-400";
  const stroke = positive ? "#059669" : negative ? "#e11d48" : "#1d4ed8";
  const arrow = data.changePercent > 0 ? "▲" : data.changePercent < 0 ? "▼" : "·";

  return (
    <div className="px-4 py-3 bg-white">
      <p className="text-xs text-gray-500">{data.label}</p>
      <p className="text-3xl font-semibold text-gray-900 tabular-nums">{data.value}</p>
      <p className={`text-xs font-medium ${color} mt-1`}>
        {arrow} {Math.abs(data.changePercent * 100).toFixed(1)}%
      </p>
      <div className="h-10 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.spark} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
