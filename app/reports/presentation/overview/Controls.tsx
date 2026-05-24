"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { GscSite } from "@/lib/gsc";
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

export function OverviewControls({
  sites,
  properties,
  currentSite,
  currentProperty,
  currentDays,
  currentStart,
  currentEnd,
  currentBranded,
  currentEvents,
  eventOptions,
}: {
  sites: GscSite[];
  properties: Ga4Property[];
  currentSite: string;
  currentProperty: string;
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
          label="Site"
          values={currentSite ? [currentSite] : []}
          options={sites.map((s) => s.siteUrl)}
          onChange={(vs) => pushImmediate({ site: vs[0] ?? null })}
          placeholder="Select a site…"
        />
        <Combobox
          label="GA4 property"
          values={currentProperty ? [propertyLabel(currentProperty)] : []}
          options={properties.map((p) => `${p.accountName} — ${p.propertyName}`)}
          onChange={(vs) => {
            const label = vs[0];
            const match = properties.find((p) => `${p.accountName} — ${p.propertyName}` === label);
            pushImmediate({ propertyId: match?.propertyId ?? null });
          }}
          placeholder="Select a property…"
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
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
          {PRESET_DAYS.map((p) => {
            const active = !usingCustom && currentDays === p.value;
            return (
              <button
                key={p.value}
                onClick={() => pushImmediate({ days: String(p.value), start: null, end: null })}
                className={`px-3 py-1.5 text-sm transition-colors ${active ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
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
