"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigation } from "./NavigationContext";

interface Tab {
  id: string;
  href: string;
  label: string;
}

export function TabNav({
  tabs,
  activeTab,
  children,
}: {
  tabs: Tab[];
  activeTab: string;
  children: React.ReactNode;
}) {
  const { pendingHref } = useNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<{ left: number; width: number } | null>(null);

  const targetHref =
    pendingHref ?? tabs.find((t) => t.id === activeTab)?.href ?? tabs[0]?.href ?? "";
  const targetIdx = tabs.findIndex((t) => t.href === targetHref);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || targetIdx < 0) return;
    const measure = () => {
      const links = container.querySelectorAll<HTMLElement>(":scope > a");
      const link = links[targetIdx];
      if (!link) return;
      const cRect = container.getBoundingClientRect();
      const lRect = link.getBoundingClientRect();
      setHighlight({ left: lRect.left - cRect.left, width: lRect.width });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [targetIdx, tabs.length]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center gap-1 bg-black border border-neutral-800 p-1 justify-self-start"
    >
      {highlight && (
        <div
          className="absolute top-1 bottom-1 bg-white z-0"
          style={{
            left: `${highlight.left}px`,
            width: `${highlight.width}px`,
            transition: "left 220ms cubic-bezier(0.4, 0, 0.2, 1), width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      )}
      {children}
    </div>
  );
}
