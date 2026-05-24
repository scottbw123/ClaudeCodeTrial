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
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<{ left: number; width: number } | null>(null);
  const idx = options.findIndex((o) => o.value === value);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || idx < 0) return;
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
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
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
