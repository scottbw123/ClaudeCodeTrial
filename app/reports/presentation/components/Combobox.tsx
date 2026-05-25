"use client";

import { useEffect, useRef, useState } from "react";

export interface ComboboxProps {
  label: string;
  values: string[];
  excludeValues?: string[];
  options: string[];
  onChange: (values: string[], excludeValues: string[]) => void;
  multi?: boolean;
  placeholder?: string;
  /**
   * If true, "Select all" / "Deselect all" buttons with an active search add the search
   * text as ONE substring chip (efficient, no URL bloat). If false, they expand to the
   * matching individual items (capped at BULK_CAP for exact-match filters like GA4 channel).
   */
  substringMode?: boolean;
}

const RENDER_CAP = 500;
const BULK_CAP = 50;

export function Combobox({
  label,
  values,
  excludeValues = [],
  options,
  onChange,
  multi = false,
  placeholder,
  substringMode = false,
}: ComboboxProps) {
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

  function matchAny(opt: string, patterns: string[]): boolean {
    const lower = opt.toLowerCase();
    if (substringMode) return patterns.some((p) => lower.includes(p.toLowerCase()));
    return patterns.some((p) => p.toLowerCase() === lower);
  }

  // Effective population: an option is "in" if it isn't excluded and either there
  // are no include patterns (everything in by default) or it matches an include.
  function inPopulation(opt: string): boolean {
    if (matchAny(opt, excludeValues)) return false;
    if (values.length === 0) return true;
    return matchAny(opt, values);
  }

  function toggle(opt: string) {
    if (!multi) {
      onChange([opt], []);
      setOpen(false);
      setSearch("");
      return;
    }
    if (inPopulation(opt)) {
      // Remove from the population → exclude this exact option (and drop any exact include).
      onChange(
        values.filter((v) => v !== opt),
        Array.from(new Set([...excludeValues, opt]))
      );
    } else {
      // Add to the population → include this exact option (and drop any exact exclude).
      onChange(
        Array.from(new Set([...values, opt])),
        excludeValues.filter((v) => v !== opt)
      );
    }
  }

  function addInclude(term: string) {
    const next = values.includes(term) ? values : [...values, term];
    const nextExc = excludeValues.filter((v) => v !== term);
    onChange(next, nextExc);
  }

  function addExclude(term: string) {
    const nextExc = excludeValues.includes(term) ? excludeValues : [...excludeValues, term];
    const next = values.filter((v) => v !== term);
    onChange(next, nextExc);
  }

  function selectAll() {
    if (!multi) return;
    const term = search.trim();
    if (!term) {
      // No search: clear all filters → "everything matches".
      onChange([], []);
      return;
    }
    if (substringMode) {
      addInclude(term);
      setSearch("");
      return;
    }
    const take = filtered.slice(0, BULK_CAP);
    const merged = Array.from(new Set([...values, ...take]));
    const nextExc = excludeValues.filter((v) => !take.includes(v));
    onChange(merged, nextExc);
  }

  function deselectAll() {
    if (!multi) return;
    const term = search.trim();
    if (!term) {
      // No search: clear all chips. Empty includes + excludes = no filter = everything.
      onChange([], []);
      return;
    }
    if (substringMode) {
      addExclude(term);
      setSearch("");
      return;
    }
    const take = filtered.slice(0, BULK_CAP);
    const stripped = values.filter((v) => !take.includes(v));
    const mergedExc = Array.from(new Set([...excludeValues, ...take]));
    onChange(stripped, mergedExc);
  }

  function clearAll() {
    onChange([], []);
    setSearch("");
  }

  function removeInclude(v: string) {
    onChange(values.filter((x) => x !== v), excludeValues);
  }
  function removeExclude(v: string) {
    onChange(values, excludeValues.filter((x) => x !== v));
  }

  const hasAny = values.length > 0 || excludeValues.length > 0;
  const totalChips = values.length + excludeValues.length;

  return (
    <div ref={containerRef} className="flex flex-col relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-gray-500 not-italic">{label}</span>
        {hasAny && (
          <button type="button" onClick={clearAll} className="text-[10px] text-gray-400 hover:text-gray-700">
            Clear
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-wrap items-center gap-1 min-h-[36px] w-full border border-gray-300 bg-white px-2 py-1 text-left text-sm hover:border-gray-400"
      >
        {!hasAny ? (
          <span className="text-gray-400 px-1">{placeholder ?? "Select…"}</span>
        ) : (
          <>
            {values.slice(0, 10).map((v) => (
              <span key={`i-${v}`} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 px-1.5 py-0.5 text-xs border border-indigo-200">
                <span className="truncate max-w-[120px]" title={`Include: ${v}`}>{v}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); removeInclude(v); }}
                  className="text-indigo-500 hover:text-indigo-900 cursor-pointer"
                >×</span>
              </span>
            ))}
            {excludeValues.slice(0, 10).map((v) => (
              <span key={`e-${v}`} className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 px-1.5 py-0.5 text-xs border border-rose-200">
                <span className="text-rose-400">−</span>
                <span className="truncate max-w-[120px]" title={`Exclude: ${v}`}>{v}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); removeExclude(v); }}
                  className="text-rose-500 hover:text-rose-900 cursor-pointer"
                >×</span>
              </span>
            ))}
            {totalChips > 20 && <span className="text-xs text-gray-500">+{totalChips - 20} more</span>}
          </>
        )}
        <span className="ml-auto text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 border border-gray-300 bg-white shadow-lg overflow-hidden">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && multi && search.trim()) {
                  e.preventDefault();
                  if (substringMode) {
                    addInclude(search.trim());
                    setSearch("");
                  } else {
                    const term = search.trim();
                    if (options.includes(term)) addInclude(term);
                    setSearch("");
                  }
                }
              }}
              placeholder={`Search ${options.length.toLocaleString()} options…`}
              className="w-full outline-none text-sm px-2 py-1 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {multi && (
              <div className="flex flex-col gap-1 mt-1.5">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs items-center">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-indigo-700 hover:underline font-medium"
                    title={search.trim() ? `Include items matching "${search.trim()}"` : "Clear all filters"}
                  >
                    {search.trim()
                      ? (substringMode ? `Include "${search.trim()}"` : `Select ${Math.min(filtered.length, BULK_CAP)} matching`)
                      : "Reset to all"}
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-rose-700 hover:underline font-medium"
                    title={search.trim() ? `Exclude items matching "${search.trim()}"` : "Clear all filters"}
                  >
                    {search.trim()
                      ? (substringMode ? `Exclude "${search.trim()}"` : `Remove ${Math.min(filtered.length, BULK_CAP)} matching`)
                      : "Clear all"}
                  </button>
                </div>
                {search.trim() !== "" && substringMode && (
                  <span className="text-[10px] text-gray-500 not-italic">
                    Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 font-mono">Enter</kbd> to include &ldquo;{search.trim()}&rdquo;
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
                const isInc = inPopulation(o);
                const isExc = matchAny(o, excludeValues);
                return (
                  <div key={o} className="group flex items-stretch hover:bg-gray-50">
                    <label
                      className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-1.5 text-sm cursor-pointer ${isExc ? "text-rose-700 line-through" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isInc}
                        onChange={() => toggle(o)}
                        className="shrink-0"
                      />
                      <span className="truncate" title={o}>{o}</span>
                    </label>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange([o], []);
                        setSearch("");
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-3 text-[10px] uppercase tracking-wide text-blue-600 hover:bg-blue-50 hover:text-blue-800 font-semibold"
                      title={`Select only ${o}`}
                    >
                      Only
                    </button>
                  </div>
                );
              })
            )}
            {filtered.length > RENDER_CAP && (
              <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 not-italic">
                Showing first {RENDER_CAP.toLocaleString()} of {filtered.length.toLocaleString()} matches.
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-500 flex justify-between items-center bg-white not-italic">
            <span>
              {values.length} included · {excludeValues.length} excluded · {filtered.length.toLocaleString()} shown
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
