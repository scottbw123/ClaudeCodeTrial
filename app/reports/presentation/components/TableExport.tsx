"use client";

import { useRef } from "react";

/**
 * Wraps a table (or any element containing a <table>) and reveals a "↓ CSV"
 * button on hover that exports the rendered rows. It scrapes the DOM so it
 * works for any table without per-table wiring — exporting exactly what's shown
 * (respecting the current filters, sort order, and number formatting).
 */
export function TableExport({ title, children }: { title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function escapeCell(raw: string): string {
    const clean = raw.replace(/[▲▼·↓›‹]/g, "").replace(/\s+/g, " ").trim();
    if (/[",\n]/.test(clean)) return `"${clean.replace(/"/g, '""')}"`;
    return clean;
  }

  function download() {
    const table = ref.current?.querySelector("table");
    if (!table) return;
    const lines: string[] = [];
    for (const tr of Array.from(table.querySelectorAll("tr"))) {
      const cells = Array.from(tr.querySelectorAll("th,td"));
      if (cells.length === 0) continue;
      lines.push(cells.map((c) => escapeCell(c.textContent || "")).join(","));
    }
    if (lines.length === 0) return;
    const csv = lines.join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "");
    a.href = url;
    a.download = `${slug || "table"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div ref={ref} className="group relative">
      <button
        type="button"
        onClick={download}
        className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[11px] px-2 py-1 flex items-center gap-1 shadow-lg hover:bg-gray-800 not-italic"
        title="Download this table as CSV"
      >
        ↓ CSV
      </button>
      {children}
    </div>
  );
}
