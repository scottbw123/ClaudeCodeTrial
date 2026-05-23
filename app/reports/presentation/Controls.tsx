"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { GscSite } from "@/lib/gsc";
import type { Ga4Property } from "@/lib/ga4";

const PRESET_DAYS = [
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "8mo", value: 240 },
  { label: "1y", value: 365 },
];

export function Controls({
  sites,
  properties,
  currentSite,
  currentProperty,
  currentDays,
  currentQuery,
  currentPage,
  queryOptions,
  pageOptions,
}: {
  sites: GscSite[];
  properties: Ga4Property[];
  currentSite: string;
  currentProperty: string;
  currentDays: number;
  currentQuery: string;
  currentPage: string;
  queryOptions: string[];
  pageOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    if (key === "site" || key === "propertyId" || key === "days") {
      sp.delete("filterQuery");
      sp.delete("filterPage");
    }
    startTransition(() => router.push(`?${sp.toString()}`));
  }

  return (
    <section className="max-w-[1400px] mx-auto px-6 pt-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Select
          label="Site"
          value={currentSite}
          onChange={(v) => update("site", v)}
          options={sites.map((s) => ({ value: s.siteUrl, label: s.siteUrl }))}
        />
        <Select
          label="GA4 property"
          value={currentProperty}
          onChange={(v) => update("propertyId", v)}
          options={properties.map((p) => ({ value: p.propertyId, label: `${p.accountName} — ${p.propertyName}` }))}
        />
        <Select
          label="Date range"
          value={String(currentDays)}
          onChange={(v) => update("days", v)}
          options={PRESET_DAYS.map((p) => ({ value: String(p.value), label: `Last ${p.label}` }))}
        />
        <Select
          label="Landing Page"
          value={currentPage}
          onChange={(v) => update("filterPage", v)}
          options={[{ value: "", label: "All pages" }, ...pageOptions.map((p) => ({ value: p, label: p }))]}
        />
        <Select
          label="Query"
          value={currentQuery}
          onChange={(v) => update("filterQuery", v)}
          options={[{ value: "", label: "All queries" }, ...queryOptions.map((q) => ({ value: q, label: q }))]}
        />
      </div>
      {pending && <p className="text-xs text-gray-400 mt-2">Refreshing…</p>}
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
            {o.label.length > 70 ? o.label.slice(0, 67) + "…" : o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
