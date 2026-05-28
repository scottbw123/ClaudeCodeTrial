"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      data-pdf-hide
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
      title="Re-fetch data with current filters (useful after quota errors)"
    >
      <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 ${pending ? "animate-spin" : ""}`} aria-hidden>
        <path
          d="M8 3V1L4.5 4 8 7V5a3 3 0 1 1-2.65 4.4l-1.4.84A4.5 4.5 0 1 0 8 3z"
          fill="currentColor"
        />
      </svg>
      {pending ? "Refreshing…" : "Refresh data"}
    </button>
  );
}
