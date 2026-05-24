"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { GscSite } from "@/lib/gsc";
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

export function OverviewControls({
  sites,
  properties,
  currentSites,
  currentProperties,
  currentDays,
  currentStart,
  currentEnd,
  currentBranded,
  currentEvents,
  eventOptions,
}: {
  sites: GscSite[];
  properties: Ga4Property[];
  currentSites: string[];
  currentProperties: string[];
  currentDays: number;
  currentStart: string;
  currentEnd: string;
  currentBranded: string[];
  currentEvents: string[];
  eventOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [localBranded, setLocalBranded] = useState(currentBranded);
  const [localEvents, setLocalEvents] = useState(currentEvents);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draftBranded, setDraftBranded] = useState("");

  useEffect(() => setLocalBranded(currentBranded), [currentBranded.join(",")]);
  useEffect(() => setLocalEvents(currentEvents), [currentEvents.join(",")]);

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

  function addBranded() {
    const v = draftBranded.trim();
    if (!v || localBranded.includes(v)) return;
    const next = [...localBranded, v];
    setLocalBranded(next);
    setDraftBranded("");
    pushDebounced({ branded: next.join(",") });
  }

  function removeBranded(v: string) {
    const next = localBranded.filter((x) => x !== v);
    setLocalBranded(next);
    pushDebounced({ branded: next.length ? next.join(",") : null });
  }

  const usingCustom = Boolean(searchParams.get("start") && searchParams.get("end"));
  const propertyLabel = (id: string) => {
    const p = properties.find((p) => p.propertyId === id);
    return p ? `${p.accountName} — ${p.propertyName}` : id;
  };

  return (
    <section className="max-w-[1400px] mx-auto px-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Combobox
          label="Sites (multi-select)"
          values={currentSites}
          options={sites.map((s) => s.siteUrl)}
          multi
          onChange={(vs) => pushImmediate({ site: vs.length ? vs.join(",") : null })}
          placeholder="Select sites…"
        />
        <Combobox
          label="GA4 properties (multi-select)"
          values={currentProperties.map(propertyLabel)}
          options={properties.map((p) => `${p.accountName} — ${p.propertyName}`)}
          multi
          onChange={(vs) => {
            const ids = vs
              .map((label) => properties.find((p) => `${p.accountName} — ${p.propertyName}` === label)?.propertyId)
              .filter(Boolean) as string[];
            pushImmediate({ propertyId: ids.length ? ids.join(",") : null });
          }}
          placeholder="Select properties…"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
            Branded query terms (type & press Enter)
          </span>
          <div className="flex flex-wrap items-center gap-1 min-h-[36px] rounded-md border border-gray-300 bg-white px-2 py-1">
            {localBranded.map((v) => (
              <span key={v} className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                <span className="truncate max-w-[140px]" title={v}>{v}</span>
                <button
                  type="button"
                  onClick={() => removeBranded(v)}
                  className="text-gray-500 hover:text-gray-900"
                  aria-label={`Remove ${v}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={draftBranded}
              onChange={(e) => setDraftBranded(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addBranded();
                } else if (e.key === "Backspace" && draftBranded === "" && localBranded.length > 0) {
                  removeBranded(localBranded[localBranded.length - 1]);
                }
              }}
              placeholder={localBranded.length === 0 ? "e.g. omniflow, omni flow…" : ""}
              className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-1">
            Splits queries into Branded vs Non-Branded via substring match on the query text.
          </span>
        </div>

        <Combobox
          label="Events to count as conversions (multi-select)"
          values={localEvents}
          options={eventOptions}
          multi
          onChange={(vs) => {
            setLocalEvents(vs);
            pushDebounced({ events: vs.length ? vs.join(",") : null });
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
