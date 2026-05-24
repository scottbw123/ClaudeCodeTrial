"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Ga4Property } from "@/lib/ga4";
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

export function AiControls({
  properties,
  currentProperty,
  currentDays,
  currentStart,
  currentEnd,
  currentPageUrls,
  currentEventNames,
  pageOptions,
  eventOptions,
}: {
  properties: Ga4Property[];
  currentProperty: string;
  currentDays: number;
  currentStart: string;
  currentEnd: string;
  currentPageUrls: string[];
  currentEventNames: string[];
  pageOptions: string[];
  eventOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [localPageUrls, setLocalPageUrls] = useState(currentPageUrls);
  const [localEventNames, setLocalEventNames] = useState(currentEventNames);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocalPageUrls(currentPageUrls), [currentPageUrls.join(",")]);
  useEffect(() => setLocalEventNames(currentEventNames), [currentEventNames.join(",")]);

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
  const pushImmediate = pushDebounced;

  const usingCustom = Boolean(searchParams.get("start") && searchParams.get("end"));
  const propertyLabel = (id: string) => {
    const p = properties.find((p) => p.propertyId === id);
    return p ? `${p.accountName} — ${p.propertyName}` : id;
  };

  return (
    <section className="max-w-[1400px] mx-auto px-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Combobox
          label="GA4 property"
          values={currentProperty ? [propertyLabel(currentProperty)] : []}
          options={properties.map((p) => `${p.accountName} — ${p.propertyName}`)}
          onChange={(vs) => {
            const label = vs[0];
            const match = properties.find((p) => `${p.accountName} — ${p.propertyName}` === label);
            pushImmediate({ propertyId: match?.propertyId ?? null, pageUrl: null, eventName: null });
          }}
          placeholder="Select a property…"
        />
        <Combobox
          label="Full page URL contains (multi-select)"
          values={localPageUrls}
          options={pageOptions}
          multi
          substringMode
          onChange={(vs) => {
            setLocalPageUrls(vs);
            pushDebounced({ pageUrl: vs.length ? vs.join(",") : null });
          }}
          placeholder="All pages"
        />
        <Combobox
          label="Event name (multi-select)"
          values={localEventNames}
          options={eventOptions}
          multi
          onChange={(vs) => {
            setLocalEventNames(vs);
            pushDebounced({ eventName: vs.length ? vs.join(",") : null });
          }}
          placeholder="All events"
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
            <span className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Custom start</span>
            <input
              type="date"
              value={currentStart}
              max={currentEnd}
              onChange={(e) => pushImmediate({ start: e.target.value, end: currentEnd, days: null })}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Custom end</span>
            <input
              type="date"
              value={currentEnd}
              min={currentStart}
              onChange={(e) => pushImmediate({ start: currentStart, end: e.target.value, days: null })}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
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
