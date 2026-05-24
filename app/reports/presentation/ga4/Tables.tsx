"use client";

import { useState } from "react";
import type { Ga4Row } from "@/lib/ga4";
import { UrlCell } from "../components/UrlCell";

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

interface SortableTableProps {
  title: string;
  description: string;
  columns: {
    key: string;
    label: string;
    align?: "left" | "right" | "center";
    type: "string" | "int" | "pct" | "duration" | "decimal" | "key-badge";
    dimensionIndex?: number;
    metricIndex?: number;
  }[];
  rows: Ga4Row[];
}

function SortableTable({ title, description, columns, rows }: SortableTableProps) {
  const defaultSort = columns.find((c) => c.type === "int")?.key ?? columns[0].key;
  const [sortKey, setSortKey] = useState<string>(defaultSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function clickHeader(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function valueFor(row: Ga4Row, col: SortableTableProps["columns"][number]): number | string {
    if (col.dimensionIndex !== undefined) return row.dimensionValues[col.dimensionIndex] ?? "";
    if (col.metricIndex !== undefined) return Number(row.metricValues[col.metricIndex] ?? 0);
    return "";
  }

  const sortCol = columns.find((c) => c.key === sortKey);
  const sorted = sortCol
    ? [...rows].sort((a, b) => {
        const av = valueFor(a, sortCol);
        const bv = valueFor(b, sortCol);
        const mul = sortDir === "asc" ? 1 : -1;
        if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * mul;
        return (Number(av) - Number(bv)) * mul;
      })
    : rows;

  function renderCell(row: Ga4Row, col: SortableTableProps["columns"][number]) {
    const v = valueFor(row, col);
    switch (col.type) {
      case "string":
        // URLs deserve a portal-based tooltip; other strings just truncate.
        return String(v).startsWith("http") || String(v).startsWith("/")
          ? <UrlCell url={String(v)} />
          : <span className="truncate" title={String(v)}>{String(v)}</span>;
      case "int":
        return fmtInt(Number(v));
      case "pct":
        return fmtPct(Number(v));
      case "duration":
        return fmtDuration(Number(v));
      case "decimal":
        return Number(v).toFixed(2);
      case "key-badge":
        return v === "true" ? (
          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">KEY</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description} <span className="text-gray-400">· Click any column header to sort.</span></p>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-white text-xs sticky top-0 z-10">
            <tr>
              {columns.map((col) => {
                const active = col.key === sortKey;
                const align = col.align ?? (col.type === "string" || col.type === "key-badge" ? "left" : "right");
                return (
                  <th
                    key={col.key}
                    onClick={() => clickHeader(col.key)}
                    className={`px-3 py-2 ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"} font-semibold cursor-pointer select-none whitespace-nowrap ${active ? "text-white" : "text-gray-300 hover:text-white"}`}
                  >
                    {col.label}
                    <span className="ml-1 inline-block w-3">{active ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-gray-400">No data</td></tr>
            )}
            {sorted.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {columns.map((col) => {
                  const align = col.align ?? (col.type === "string" || col.type === "key-badge" ? "left" : "right");
                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-1.5 ${align === "right" ? "text-right tabular-nums" : align === "center" ? "text-center" : "text-gray-900"} ${col.type === "string" ? "max-w-[460px] truncate" : ""}`}
                    >
                      {renderCell(r, col)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
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
      <SortableTable
        title="Traffic Sources"
        description="By channel and source/medium — acquisition, behavior, conversions."
        rows={trafficSources}
        columns={[
          { key: "channel", label: "Channel", type: "string", dimensionIndex: 0 },
          { key: "source", label: "Source / Medium", type: "string", dimensionIndex: 1 },
          { key: "sessions", label: "Sessions", type: "int", metricIndex: 0 },
          { key: "users", label: "Users", type: "int", metricIndex: 1 },
          { key: "bounceRate", label: "Bounce Rate", type: "pct", metricIndex: 2 },
          { key: "avgSession", label: "Avg. Session", type: "duration", metricIndex: 3 },
          { key: "pps", label: "Pages / Session", type: "decimal", metricIndex: 4 },
          { key: "keyEvents", label: "Key Events", type: "int", metricIndex: 5 },
        ]}
      />

      <SortableTable
        title="Events"
        description="All event activity, ranked by count."
        rows={events}
        columns={[
          { key: "eventName", label: "Event Name", type: "string", dimensionIndex: 0 },
          { key: "isKeyEvent", label: "Key Event?", type: "key-badge", dimensionIndex: 1, align: "center" },
          { key: "count", label: "Count", type: "int", metricIndex: 0 },
          { key: "users", label: "Users", type: "int", metricIndex: 1 },
          { key: "perUser", label: "Per User", type: "decimal", metricIndex: 2 },
        ]}
      />

      <SortableTable
        title="Page Performance"
        description="Per-page views, sessions, events and key events."
        rows={pagePerformance}
        columns={[
          { key: "page", label: "Page Path", type: "string", dimensionIndex: 0 },
          { key: "views", label: "Views", type: "int", metricIndex: 0 },
          { key: "users", label: "Users", type: "int", metricIndex: 1 },
          { key: "sessions", label: "Sessions", type: "int", metricIndex: 2 },
          { key: "events", label: "Events", type: "int", metricIndex: 3 },
          { key: "keyEvents", label: "Key Events", type: "int", metricIndex: 4 },
        ]}
      />
    </section>
  );
}
