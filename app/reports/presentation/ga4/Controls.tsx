"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Ga4Property } from "@/lib/ga4";
import { Combobox } from "../components/Combobox";
import { RefreshButton } from "../components/RefreshButton";

const PRESET_DAYS = [
  { label: "Last 30d", value: 30 },
  { label: "Last 90d", value: 90 },
  { label: "Last 180d", value: 180 },
  { label: "Last 1y", value: 365 },
];

const DEBOUNCE_MS = 500;

export function Ga4Controls({
  properties,
  currentProperty,
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
  currentProperty: string;
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

  function pushImmediate(updates: Record<string, string | null>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    startTransition(() => router.push(`?${buildSp(updates).toString()}`));
  }

  function pushDebounced(updates: Record<string, string | null>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => router.push(`?${buildSp(updates).toString()}`));
    }, DEBOUNCE_MS);
  }

  const usingCustom = Boolean(searchParams.get("start") && searchParams.get("end"));

  return (
    <section className="max-w-[1400px] mx-auto px-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <Combobox
          label="GA4 property"
          values={currentProperty ? [propertyLabelById(properties, currentProperty)] : []}
          options={properties.map((p) => `${p.accountName} — ${p.propertyName}`)}
          onChange={(vs) => {
            const label = vs[0];
            const match = properties.find((p) => `${p.accountName} — ${p.propertyName}` === label);
            pushImmediate({
              propertyId: match?.propertyId ?? null,
              channel: null,
              pageUrl: null,
              keyEvent: null,
              eventName: null,
            });
          }}
          placeholder="Select a property…"
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
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
          {PRESET_DAYS.map((p) => {
            const active = !usingCustom && currentDays === p.value;
            return (
              <button
                key={p.value}
                onClick={() => pushImmediate({ days: String(p.value), start: null, end: null })}
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

function propertyLabelById(properties: Ga4Property[], id: string): string {
  const p = properties.find((p) => p.propertyId === id);
  return p ? `${p.accountName} — ${p.propertyName}` : id;
}
