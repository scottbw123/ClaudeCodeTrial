"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { PosthogProject } from "@/lib/posthog";
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

export function PostHogControls({
  projects,
  currentProjects,
  currentDays,
  currentStart,
  currentEnd,
  currentEventNames,
  currentFunnelStart,
  currentFunnelEnd,
  eventOptions,
}: {
  projects: PosthogProject[];
  currentProjects: string[];
  currentDays: number;
  currentStart: string;
  currentEnd: string;
  currentEventNames: string[];
  currentFunnelStart: string;
  currentFunnelEnd: string;
  eventOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [localEventNames, setLocalEventNames] = useState(currentEventNames);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const projectLabel = (id: string) => {
    const p = projects.find((p) => p.projectId === id);
    return p ? `${p.organizationName} — ${p.projectName}` : id;
  };

  return (
    <section className="max-w-[1400px] mx-auto px-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Combobox
          label="PostHog projects (multi-select)"
          values={currentProjects.map(projectLabel)}
          options={projects.map((p) => `${p.organizationName} — ${p.projectName}`)}
          multi
          onChange={(vs) => {
            const ids = vs
              .map((label) => projects.find((p) => `${p.organizationName} — ${p.projectName}` === label)?.projectId)
              .filter(Boolean) as string[];
            pushImmediate({ projectId: ids.length ? ids.join(",") : null, eventName: null, funnelStart: null, funnelEnd: null });
          }}
          placeholder="Select projects…"
        />
        <Combobox
          label="Event filter (multi-select)"
          values={localEventNames}
          options={eventOptions}
          multi
          onChange={(vs) => {
            setLocalEventNames(vs);
            pushDebounced({ eventName: vs.length ? vs.join(",") : null });
          }}
          placeholder="All events"
        />
        <Combobox
          label="Funnel step 1 (event)"
          values={currentFunnelStart ? [currentFunnelStart] : []}
          options={eventOptions}
          onChange={(vs) => pushImmediate({ funnelStart: vs[0] ?? null })}
          placeholder="Start event…"
        />
        <Combobox
          label="Funnel step 2 (event)"
          values={currentFunnelEnd ? [currentFunnelEnd] : []}
          options={eventOptions}
          onChange={(vs) => pushImmediate({ funnelEnd: vs[0] ?? null })}
          placeholder="End event…"
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
