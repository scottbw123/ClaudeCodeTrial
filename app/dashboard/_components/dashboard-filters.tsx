"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CLIENT_STAGES, STAGE_LABELS } from "@/lib/notion/types";

export function DashboardFilters({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const stage = params.get("stage") ?? "";
  const project = params.get("project") ?? "";
  const q = params.get("q") ?? "";
  const needsInput = params.get("needsInput") === "1";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="search"
        defaultValue={q}
        placeholder="Search deliverables…"
        onChange={(e) => setParam("q", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
      />

      <select
        value={stage}
        onChange={(e) => setParam("stage", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All stages</option>
        {CLIENT_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={project}
        onChange={(e) => setParam("project", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-1.5 text-sm text-gray-600 ml-1 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={needsInput}
          onChange={(e) => setParam("needsInput", e.target.checked ? "1" : "")}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Needs your review
      </label>
    </div>
  );
}
