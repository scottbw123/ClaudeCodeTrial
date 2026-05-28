"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Ga4Property } from "@/lib/ga4";
import { Combobox } from "../components/Combobox";
import { RefreshButton } from "../components/RefreshButton";
import { SlideToggle } from "../components/SlideToggle";
import { DateRangePicker } from "../components/DateRangePicker";

const PRESET_DAYS = [
  { label: "Last 30d", value: 30 },
  { label: "Last 90d", value: 90 },
  { label: "Last 180d", value: 180 },
  { label: "Last 1y", value: 365 },
];

const DEBOUNCE_MS = 500;

export function Ga4Controls({
  properties,
  currentProperties,
  currentDays,
  currentStart,
  currentEnd,
  currentChannels,
  currentPageUrls,
  currentKeyEvent,
  currentEventNames,
  channelOptions,
  pageOptions,
  eventOptions,
}: {
  properties: Ga4Property[];
  currentProperties: string[];
  currentDays: number;
  currentStart: string;
  currentEnd: string;
  currentChannels: string[];
  currentPageUrls: string[];
  currentKeyEvent: string;
  currentEventNames: string[];
  channelOptions: string[];
  pageOptions: string[];
  eventOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [localChannels, setLocalChannels] = useState(currentChannels);
  const [localPageUrls, setLocalPageUrls] = useState(currentPageUrls);
  const [localEventNames, setLocalEventNames] = useState(currentEventNames);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocalChannels(currentChannels), [currentChannels.join(",")]);
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

  return (
    <section className="max-w-[1400px] mx-auto px-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <Combobox
          label="GA4 properties (multi-select)"
          values={currentProperties.map((id) => propertyLabelById(properties, id))}
          options={properties.map((p) => `${p.accountName} — ${p.propertyName}`)}
          multi
          onChange={(vs) => {
            const ids = vs
              .map((label) => properties.find((p) => `${p.accountName} — ${p.propertyName}` === label)?.propertyId)
              .filter(Boolean) as string[];
            pushImmediate({
              propertyId: ids.length ? ids.join(",") : null,
              channel: null,
              pageUrl: null,
              keyEvent: null,
              eventName: null,
            });
          }}
          placeholder="Select properties…"
        />
        <Combobox
          label="Channel (multi-select)"
          values={localChannels}
          options={channelOptions}
          multi
          onChange={(vs) => {
            setLocalChannels(vs);
            pushDebounced({ channel: vs.length ? vs.join(",") : null });
          }}
          placeholder="All channels"
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
        <label className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Key event filter</span>
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentKeyEvent}
            onChange={(e) => pushImmediate({ keyEvent: e.target.value || null })}
          >
            <option value="">Any</option>
            <option value="true">Key events only</option>
            <option value="false">Non-key only</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3">
        <SlideToggle
          options={PRESET_DAYS.map((p) => ({ value: String(p.value), label: p.label }))}
          value={!usingCustom ? String(currentDays) : ""}
          onChange={(v) => pushImmediate({ days: v, start: null, end: null })}
        />

        <DateRangePicker
          startDate={currentStart}
          endDate={currentEnd}
          onApply={(s, e) => pushImmediate({ start: s, end: e, days: null })}
        />

        <div className="ml-auto flex items-center gap-3">
          {pending && <span className="text-xs text-gray-400">Refreshing…</span>}
          <RefreshButton />
        </div>
      </div>
    </section>
  );
}

function propertyLabelById(properties: Ga4Property[], id: string): string {
  const p = properties.find((p) => p.propertyId === id);
  return p ? `${p.accountName} — ${p.propertyName}` : id;
}
