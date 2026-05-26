"use client";

import { useEffect } from "react";
import type { Task } from "@/lib/notion/types";
import { OrderReviewBody } from "./order-review-body";

export function OrderDrawer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [task, onClose]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200 shrink-0">
          <h1 className="font-display text-2xl text-ink">Order Review</h1>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-ink p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          <OrderReviewBody task={task} />
        </div>
      </div>
    </div>
  );
}
