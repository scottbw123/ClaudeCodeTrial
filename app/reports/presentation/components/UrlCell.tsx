"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function UrlCell({ url, className = "" }: { url: string; className?: string }) {
  const [pos, setPos] = useState<{ x: number; y: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <span
        className={`block truncate cursor-help ${className}`}
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ x: r.left, y: r.bottom + 4, width: r.width });
        }}
        onMouseLeave={() => setPos(null)}
      >
        {url}
      </span>
      {mounted && pos &&
        createPortal(
          <div
            className="fixed z-[9999] bg-black text-white text-xs px-2 py-1 max-w-[640px] break-all shadow-xl pointer-events-none"
            style={{ left: pos.x, top: pos.y }}
          >
            {url}
          </div>,
          document.body
        )}
    </>
  );
}
