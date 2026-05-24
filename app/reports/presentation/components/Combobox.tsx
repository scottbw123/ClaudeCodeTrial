"use client";

import { useEffect, useRef, useState } from "react";

export interface ComboboxProps {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  multi?: boolean;
  placeholder?: string;
}

const RENDER_CAP = 500;

export function Combobox({ label, values, options, onChange, multi = false, placeholder }: ComboboxProps) {
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

  function toggle(value: string) {
    if (multi) {
      onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
    } else {
      onChange([value]);
      setOpen(false);
      setSearch("");
    }
  }

  function clear() {
    onChange([]);
  }

  return (
    <div ref={containerRef} className="flex flex-col relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-gray-500">{label}</span>
        {values.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-[10px] text-gray-400 hover:text-gray-700"
          >
            Clear ({values.length})
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-wrap items-center gap-1 min-h-[36px] w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-left text-sm hover:border-gray-400"
      >
        {values.length === 0 ? (
          <span className="text-gray-400 px-1">{placeholder ?? "Select…"}</span>
        ) : (
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
            {values.length > 3 && (
              <span className="text-xs text-gray-500">+{values.length - 3} more</span>
            )}
          </>
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
              placeholder={`Search ${options.length.toLocaleString()} options…`}
              className="w-full outline-none text-sm px-2 py-1 rounded border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-400">No matches</div>
            ) : (
              filtered.slice(0, RENDER_CAP).map((o) => {
                const checked = values.includes(o);
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
          <div className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-500 flex justify-between items-center bg-gray-50">
            <span>
              {values.length} selected · {filtered.length.toLocaleString()} matching
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
