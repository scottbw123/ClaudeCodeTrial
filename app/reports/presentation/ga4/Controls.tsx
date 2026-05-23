"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Ga4Property } from "@/lib/ga4";

const PRESET_DAYS = [
  { label: "Last 30d", value: 30 },
  { label: "Last 90d", value: 90 },
  { label: "Last 180d", value: 180 },
  { label: "Last 1y", value: 365 },
];

export function Ga4Controls({
  properties,
  currentProperty,
  currentDays,
  currentStart,
  currentEnd,
  currentChannel,
  currentPageUrl,
  currentKeyEvent,
  currentEventName,
  channelOptions,
  pageOptions,
  eventOptions,
}: {
  properties: Ga4Property[];
  currentProperty: string;
  currentDays: number;
  currentStart: string;
  currentEnd: string;
  currentChannel: string;
  currentPageUrl: string;
  currentKeyEvent: string;
  currentEventName: string;
  channelOptions: string[];
  pageOptions: string[];
  eventOptions: string[];
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
        <Select
          label="GA4 property"
          value={currentProperty}
          onChange={(v) => update({ propertyId: v, channel: null, pageUrl: null, keyEvent: null, eventName: null })}
          options={properties.map((p) => ({ value: p.propertyId, label: `${p.accountName} — ${p.propertyName}` }))}
        />
        <Select
          label="Channel"
          value={currentChannel}
          onChange={(v) => update({ channel: v })}
          options={[{ value: "", label: "All channels" }, ...channelOptions.map((c) => ({ value: c, label: c }))]}
        />
        <Select
          label="Page URL"
          value={currentPageUrl}
          onChange={(v) => update({ pageUrl: v })}
          options={[{ value: "", label: "All pages" }, ...pageOptions.map((p) => ({ value: p, label: p }))]}
        />
        <Select
          label="Key event only?"
          value={currentKeyEvent}
          onChange={(v) => update({ keyEvent: v })}
          options={[
            { value: "", label: "Any" },
            { value: "true", label: "Key events only" },
            { value: "false", label: "Non-key only" },
          ]}
        />
        <Select
          label="Event name"
          value={currentEventName}
          onChange={(v) => update({ eventName: v })}
          options={[{ value: "", label: "All events" }, ...eventOptions.map((e) => ({ value: e, label: e }))]}
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

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">{label}</span>
      <select
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label.length > 80 ? o.label.slice(0, 77) + "…" : o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
