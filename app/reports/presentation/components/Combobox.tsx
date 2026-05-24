"use client";

import { useEffect, useRef, useState } from "react";

export type FilterMode = "include" | "exclude";

export interface ComboboxProps {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[], mode: FilterMode) => void;
  multi?: boolean;
  mode?: FilterMode;
  placeholder?: string;
  /**
   * If true, bulk "matching" actions add the SEARCH TEXT as a single substring chip
   * (avoids stuffing thousands of items into the URL). Use for filters that the server
   * resolves with substring/regex matching (e.g. GSC query/page, GA4 pageLocation CONTAINS).
   * If false, bulk actions add individual matching items (capped to BULK_CAP).
   */
  substringMode?: boolean;
}

const RENDER_CAP = 500;
const BULK_CAP = 50;

export function Combobox({ label, values, options, onChange, multi = false, mode = "include", placeholder, substringMode = false }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const lowerSearch = search.toLowerCase();
  const filtered = lowerSearch
    ? options.filter((o) => o.toLowerCase().includes(lowerSearch))
    : options;

  function isChecked(opt: string): boolean {
    if (mode === "include") return values.includes(opt);
    return !values.includes(opt);
  }

  function toggle(opt: string) {
    if (!multi) {
      onChange([opt], "include");
      setOpen(false);
      setSearch("");
      return;
    }
    if (mode === "include") {
      onChange(
        values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt],
        "include"
      );
    } else {
      // exclude mode: clicking flips the exclusion
      onChange(
        values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt],
        "exclude"
      );
    }
  }

  function selectAllNoLimit() {
    onChange([], "exclude");
  }

  function selectAllMatching() {
    if (!multi) return;
    if (substringMode) {
      const term = search.trim();
      if (!term) return;
      if (mode === "include") {
        if (!values.includes(term)) onChange([...values, term], "include");
      } else {
        onChange(values.filter((v) => v !== term), "exclude");
      }
      setSearch("");
      return;
    }
    const take = filtered.slice(0, BULK_CAP);
    if (mode === "include") {
      const merged = Array.from(new Set([...values, ...take]));
      onChange(merged, "include");
    } else {
      onChange(values.filter((v) => !take.includes(v)), "exclude");
    }
  }

  function deselectAllMatching() {
    if (!multi) return;
    if (substringMode) {
      const term = search.trim();
      if (!term) return;
      if (mode === "exclude") {
        if (!values.includes(term)) onChange([...values, term], "exclude");
      } else {
        onChange(values.filter((v) => v !== term), "include");
      }
      setSearch("");
      return;
    }
    const take = filtered.slice(0, BULK_CAP);
    if (mode === "include") {
      onChange(values.filter((v) => !take.includes(v)), "include");
    } else {
      const merged = Array.from(new Set([...values, ...take]));
      onChange(merged, "exclude");
    }
  }

  function clearAll() {
    onChange([], "include");
    setSearch("");
  }

  let triggerText: React.ReactNode;
  let triggerCount: number | null = null;
  if (mode === "exclude") {
    triggerCount = values.length;
    triggerText = values.length === 0 ? "All selected" : `All except ${values.length}`;
  } else if (values.length === 0) {
    triggerText = <span className="text-gray-400 px-1">{placeholder ?? "Select…"}</span>;
  } else {
    triggerCount = values.length;
    triggerText = (
      <>
        {values.slice(0, 3).map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs">
            <span className="truncate max-w-[140px]" title={v}>{v}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                toggle(v);
              }}
              className="text-gray-500 hover:text-gray-900 cursor-pointer"
              aria-label={`Remove ${v}`}
            >
              ×
            </span>
          </span>
        ))}
        {values.length > 3 && <span className="text-xs text-gray-500">+{values.length - 3} more</span>}
      </>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-gray-500">{label}</span>
        {(values.length > 0 || mode === "exclude") && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[10px] text-gray-400 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-wrap items-center gap-1 min-h-[36px] w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-left text-sm hover:border-gray-400"
      >
        {triggerCount === null || mode === "exclude" ? (
          <span className={mode === "exclude" ? "text-gray-700 px-1 text-xs font-medium" : ""}>{triggerText}</span>
        ) : (
          triggerText
        )}
        <span className="ml-auto text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-md border border-gray-300 bg-white shadow-lg overflow-hidden">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && multi && search.trim()) {
                  e.preventDefault();
                  const term = search.trim();
                  if (mode === "include") {
                    if (!values.includes(term)) onChange([...values, term], "include");
                  } else {
                    if (!values.includes(term)) onChange([...values, term], "exclude");
                  }
                  setSearch("");
                }
              }}
              placeholder={`Search ${options.length.toLocaleString()} options or type custom term…`}
              className="w-full outline-none text-sm px-2 py-1 rounded border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {multi && (
              <div className="flex flex-col gap-1 mt-1.5">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs items-center">
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">All:</span>
                  <button type="button" onClick={selectAllNoLimit} className="text-blue-600 hover:underline font-medium">
                    Select all
                  </button>
                  <button type="button" onClick={clearAll} className="text-gray-700 hover:underline">
                    Deselect all
                  </button>
                  {search.trim() !== "" && filtered.length > 0 && (
                    <>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400 ml-2">Matching:</span>
                      <button type="button" onClick={selectAllMatching} className="text-blue-600 hover:underline font-medium">
                        Select {filtered.length.toLocaleString()}
                      </button>
                      <button type="button" onClick={deselectAllMatching} className="text-gray-700 hover:underline">
                        Deselect {filtered.length.toLocaleString()}
                      </button>
                    </>
                  )}
                </div>
                {search.trim() !== "" && (
                  <span className="text-[10px] text-gray-500">
                    Press <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono">Enter</kbd> to add &ldquo;{search.trim()}&rdquo; as a substring filter
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-400">No matches</div>
            ) : (
              filtered.slice(0, RENDER_CAP).map((o) => {
                const checked = isChecked(o);
                return (
                  <label
                    key={o}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(o)}
                      className="shrink-0"
                    />
                    <span className="truncate" title={o}>{o}</span>
                  </label>
                );
              })
            )}
            {filtered.length > RENDER_CAP && (
              <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
                Showing first {RENDER_CAP.toLocaleString()} of {filtered.length.toLocaleString()} matches. Narrow your search to see more.
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-500 flex justify-between items-center bg-white">
            <span>
              {mode === "exclude"
                ? `All ${options.length.toLocaleString()} except ${values.length} excluded`
                : `${values.length} selected · ${filtered.length.toLocaleString()} matching`}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-blue-600 hover:underline font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
