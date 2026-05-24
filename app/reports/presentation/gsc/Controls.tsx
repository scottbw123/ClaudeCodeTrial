"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { GscSite } from "@/lib/gsc";
import { Combobox } from "../components/Combobox";
import { RefreshButton } from "../components/RefreshButton";
import { SlideToggle } from "../components/SlideToggle";

const PRESET_DAYS = [
  { label: "Last 30d", value: 30 },
  { label: "Last 90d", value: 90 },
  { label: "Last 180d", value: 180 },
  { label: "Last 1y", value: 365 },
];

const DEBOUNCE_MS = 500;

export function GscControls({
  sites,
  currentSite,
  currentDays,
  currentStart,
  currentEnd,
  currentQueries,
  currentQueriesExclude,
  currentPages,
  currentPagesExclude,
  queryOptions,
  pageOptions,
}: {
  sites: GscSite[];
  currentSite: string;
  currentDays: number;
  currentStart: string;
  currentEnd: string;
  currentQueries: string[];
  currentQueriesExclude: string[];
  currentPages: string[];
  currentPagesExclude: string[];
  queryOptions: string[];
  pageOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [localQueries, setLocalQueries] = useState(currentQueries);
  const [localQueriesExc, setLocalQueriesExc] = useState(currentQueriesExclude);
  const [localPages, setLocalPages] = useState(currentPages);
  const [localPagesExc, setLocalPagesExc] = useState(currentPagesExclude);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocalQueries(currentQueries), [currentQueries.join(",")]);
  useEffect(() => setLocalQueriesExc(currentQueriesExclude), [currentQueriesExclude.join(",")]);
  useEffect(() => setLocalPages(currentPages), [currentPages.join(",")]);
  useEffect(() => setLocalPagesExc(currentPagesExclude), [currentPagesExclude.join(",")]);

  function buildSp(updates: Record<string, string | null>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    return sp;
  }

  function pushDebounced(updates: Record<string, string | null>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => router.push(`?${buildSp(updates).toString()}`));
    }, DEBOUNCE_MS);
  }
  // Single alias — every filter change debounces now.
  const pushImmediate = pushDebounced;

  const usingCustom = Boolean(searchParams.get("start") && searchParams.get("end"));

  return (
    <section className="max-w-[1400px] mx-auto px-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Combobox
          label="Site"
          values={currentSite ? [currentSite] : []}
          options={sites.map((s) => s.siteUrl)}
          onChange={(vs) =>
            pushImmediate({
              site: vs[0] ?? null,
              filterQuery: null, filterQueryExclude: null,
              filterPage: null, filterPageExclude: null,
            })
          }
          placeholder="Select a site…"
        />
        <Combobox
          label="Landing Page contains (substring)"
          values={localPages}
          excludeValues={localPagesExc}
          options={pageOptions}
          multi
          substringMode
          onChange={(vs, exc) => {
            setLocalPages(vs);
            setLocalPagesExc(exc);
            pushDebounced({
              filterPage: vs.length ? vs.join(",") : null,
              filterPageExclude: exc.length ? exc.join(",") : null,
            });
          }}
          placeholder="All pages"
        />
        <Combobox
          label="Query contains (substring)"
          values={localQueries}
          excludeValues={localQueriesExc}
          options={queryOptions}
          multi
          substringMode
          onChange={(vs, exc) => {
            setLocalQueries(vs);
            setLocalQueriesExc(exc);
            pushDebounced({
              filterQuery: vs.length ? vs.join(",") : null,
              filterQueryExclude: exc.length ? exc.join(",") : null,
            });
          }}
          placeholder="All queries"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3">
        <SlideToggle
          options={PRESET_DAYS.map((p) => ({ value: String(p.value), label: p.label }))}
          value={!usingCustom ? String(currentDays) : ""}
          onChange={(v) => pushImmediate({ days: v, start: null, end: null })}
        />

        <div className="flex items-end gap-2">
          <label className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-gray-500 mb-1 not-italic">Custom start</span>
            <input
              type="date"
              value={currentStart}
              max={currentEnd}
              onChange={(e) => pushImmediate({ start: e.target.value, end: currentEnd, days: null })}
              className="border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-gray-500 mb-1 not-italic">Custom end</span>
            <input
              type="date"
              value={currentEnd}
              min={currentStart}
              onChange={(e) => pushImmediate({ start: currentStart, end: e.target.value, days: null })}
              className="border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {pending && <span className="text-xs text-gray-400">Refreshing…</span>}
          <RefreshButton />
        </div>
      </div>
    </section>
  );
}
