"use client";

import { useState } from "react";
import { UrlCell } from "../components/UrlCell";

export interface DeltaRow {
  key: string;
  clicks: { current: number; changePercent: number };
  impressions: { current: number; changePercent: number };
  ctr: { current: number; changePercent: number };
  position: { current: number; changePercent: number };
}

type SortKey =
  | "key"
  | "impressions"
  | "impressionsChange"
  | "clicks"
  | "clicksChange"
  | "position"
  | "positionChange"
  | "ctr"
  | "ctrChange";

type SortDir = "asc" | "desc";

function fmtInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function fmtPct(n: number): string {
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

function HeaderCell({
  col,
  label,
  right,
  sortKey,
  sortDir,
  onClick,
}: {
  col: SortKey;
  label: string;
  right?: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (col: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onClick(col)}
      className={`px-4 py-2 ${right ? "text-right" : "text-left"} font-semibold cursor-pointer select-none whitespace-nowrap ${active ? "text-white" : "text-gray-300 hover:text-white"}`}
    >
      {label}
      <span className="ml-1 inline-block w-3">{active ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
    </th>
  );
}

export function DeltaTable({
  title,
  description,
  keyLabel,
  rows,
  totals,
}: {
  title: string;
  description: string;
  keyLabel: string;
  rows: DeltaRow[];
  totals: { clicks: number; impressions: number; ctr: number; position: number; clicksChange: number; impressionsChange: number; ctrChange: number; positionChange: number };
}) {
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function clickHeader(col: SortKey) {
    if (sortKey === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortDir("desc");
    }
  }

  function valueFor(row: DeltaRow, key: SortKey): number | string {
    switch (key) {
      case "key": return row.key;
      case "impressions": return row.impressions.current;
      case "impressionsChange": return row.impressions.changePercent;
      case "clicks": return row.clicks.current;
      case "clicksChange": return row.clicks.changePercent;
      case "position": return row.position.current;
      case "positionChange": return row.position.changePercent;
      case "ctr": return row.ctr.current;
      case "ctrChange": return row.ctr.changePercent;
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = valueFor(a, sortKey);
    const bv = valueFor(b, sortKey);
    const mul = sortDir === "asc" ? 1 : -1;
    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * mul;
    return (Number(av) - Number(bv)) * mul;
  });

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
              <th className="px-4 py-2 text-left font-semibold">#</th>
              <HeaderCell col="key" label={keyLabel} sortKey={sortKey} sortDir={sortDir} onClick={clickHeader} />
              <HeaderCell col="impressions" label="Impressions" right sortKey={sortKey} sortDir={sortDir} onClick={clickHeader} />
              <HeaderCell col="impressionsChange" label="% Δ" right sortKey={sortKey} sortDir={sortDir} onClick={clickHeader} />
              <HeaderCell col="clicks" label="Clicks" right sortKey={sortKey} sortDir={sortDir} onClick={clickHeader} />
              <HeaderCell col="clicksChange" label="% Δ" right sortKey={sortKey} sortDir={sortDir} onClick={clickHeader} />
              <HeaderCell col="position" label="Avg. Position" right sortKey={sortKey} sortDir={sortDir} onClick={clickHeader} />
              <HeaderCell col="positionChange" label="% Δ" right sortKey={sortKey} sortDir={sortDir} onClick={clickHeader} />
              <HeaderCell col="ctr" label="CTR" right sortKey={sortKey} sortDir={sortDir} onClick={clickHeader} />
              <HeaderCell col="ctrChange" label="% Δ" right sortKey={sortKey} sortDir={sortDir} onClick={clickHeader} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.key} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-1.5 text-gray-500">{i + 1}.</td>
                <td className="px-4 py-1.5 text-gray-900 max-w-[420px]">
                  <UrlCell url={r.key} />
                </td>
                <td className="px-4 py-1.5 text-right tabular-nums">{fmtInt(r.impressions.current)}</td>
                <td className="px-4 py-1.5 text-right"><Delta change={r.impressions.changePercent} /></td>
                <td className="px-4 py-1.5 text-right tabular-nums">{fmtInt(r.clicks.current)}</td>
                <td className="px-4 py-1.5 text-right"><Delta change={r.clicks.changePercent} /></td>
                <td className="px-4 py-1.5 text-right tabular-nums">{r.position.current.toFixed(2)}</td>
                <td className="px-4 py-1.5 text-right"><Delta change={r.position.changePercent} invert /></td>
                <td className="px-4 py-1.5 text-right tabular-nums">{fmtPct(r.ctr.current)}</td>
                <td className="px-4 py-1.5 text-right"><Delta change={r.ctr.changePercent} /></td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-gray-400">No data</td></tr>
            )}
          </tbody>
          <tfoot className="sticky bottom-0 z-10">
            <tr className="font-semibold bg-white border-t-2 border-gray-300">
              <td className="px-4 py-2"></td>
              <td className="px-4 py-2">Grand total</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtInt(totals.impressions)}</td>
              <td className="px-4 py-2 text-right"><Delta change={totals.impressionsChange} /></td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtInt(totals.clicks)}</td>
              <td className="px-4 py-2 text-right"><Delta change={totals.clicksChange} /></td>
              <td className="px-4 py-2 text-right tabular-nums">{totals.position.toFixed(2)}</td>
              <td className="px-4 py-2 text-right"><Delta change={totals.positionChange} invert /></td>
              <td className="px-4 py-2 text-right tabular-nums">{fmtPct(totals.ctr)}</td>
              <td className="px-4 py-2 text-right"><Delta change={totals.ctrChange} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
