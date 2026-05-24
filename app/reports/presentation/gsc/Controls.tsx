"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { GscSite } from "@/lib/gsc";
import { Combobox } from "../components/Combobox";

const PRESET_DAYS = [
  { label: "Last 30d", value: 30 },
  { label: "Last 90d", value: 90 },
  { label: "Last 180d", value: 180 },
  { label: "Last 1y", value: 365 },
];

export function GscControls({
  sites,
  currentSite,
  currentDays,
  currentStart,
  currentEnd,
  currentQueries,
  currentPages,
  queryOptions,
  pageOptions,
}: {
  sites: GscSite[];
  currentSite: string;
  currentDays: number;
  currentStart: string;
  currentEnd: string;
  currentQueries: string[];
  currentPages: string[];
  queryOptions: string[];
  pageOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(updates: Record<string, string | null>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    startTransition(() => router.push(`?${sp.toString()}`));
  }

  const usingCustom = Boolean(searchParams.get("start") && searchParams.get("end"));

  return (
    <section className="max-w-[1400px] mx-auto px-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Combobox
          label="Site"
          values={currentSite ? [currentSite] : []}
          options={sites.map((s) => s.siteUrl)}
          onChange={(vs) =>
            update({ site: vs[0] ?? null, filterQuery: null, filterPage: null })
          }
          placeholder="Select a site…"
        />
        <Combobox
          label="Landing Page (multi-select)"
          values={currentPages}
          options={pageOptions}
          multi
          onChange={(vs) => update({ filterPage: vs.length ? vs.join(",") : null })}
          placeholder="All pages"
        />
        <Combobox
          label="Query (multi-select)"
          values={currentQueries}
          options={queryOptions}
          multi
          onChange={(vs) => update({ filterQuery: vs.length ? vs.join(",") : null })}
          placeholder="All queries"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3">
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
          {PRESET_DAYS.map((p) => {
            const active = !usingCustom && currentDays === p.value;
            return (
              <button
                key={p.value}
                onClick={() => update({ days: String(p.value), start: null, end: null })}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-end gap-2">
          <label className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Custom start</span>
            <input
              type="date"
              value={currentStart}
              max={currentEnd}
              onChange={(e) => update({ start: e.target.value, end: currentEnd, days: null })}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Custom end</span>
            <input
              type="date"
              value={currentEnd}
              min={currentStart}
              onChange={(e) => update({ start: currentStart, end: e.target.value, days: null })}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        {pending && <span className="text-xs text-gray-400">Refreshing…</span>}
      </div>
    </section>
  );
}
