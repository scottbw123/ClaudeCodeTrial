"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps a fixed-height chart container and only mounts its children once the
 * box actually has a width. This avoids recharts' ResponsiveContainer measuring
 * a zero-size parent on first paint, which floods the console with
 * "The width(-1) and height(-1) of chart should be greater than 0" warnings.
 */
export function ChartBox({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      if (el.getBoundingClientRect().width > 0) setReady(true);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {ready ? children : null}
    </div>
  );
}
