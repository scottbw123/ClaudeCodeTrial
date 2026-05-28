"use client";

import { useEffect, useRef, useState } from "react";

export interface SlideToggleOption {
  value: string;
  label: string;
}

export function SlideToggle({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SlideToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  // Local state mirrors the prop but updates instantly on click — the slide
  // animates immediately while onChange (debounced upstream) fires the data refetch.
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => setLocalValue(value), [value]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<{ left: number; width: number } | null>(null);
  const idx = options.findIndex((o) => o.value === localValue);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (idx < 0) {
      setHighlight(null); // custom range active → no preset looks selected
      return;
    }
    const measure = () => {
      const btns = container.querySelectorAll<HTMLButtonElement>(":scope > button");
      const btn = btns[idx];
      if (!btn) return;
      const c = container.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      setHighlight({ left: b.left - c.left, width: b.width });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [idx, options.length]);

  return (
    <div ref={containerRef} className={`relative inline-flex border border-gray-300 ${className}`}>
      {highlight && (
        <div
          className="absolute top-0 bottom-0 bg-black z-0"
          style={{
            left: `${highlight.left}px`,
            width: `${highlight.width}px`,
            transition: "left 220ms cubic-bezier(0.4, 0, 0.2, 1), width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      )}
      {options.map((o) => {
        const active = o.value === localValue;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setLocalValue(o.value);
              onChange(o.value);
            }}
            className={`relative z-10 px-3 py-1.5 text-sm transition-colors whitespace-nowrap ${
              active ? "text-white" : "text-gray-700 hover:text-gray-900"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
