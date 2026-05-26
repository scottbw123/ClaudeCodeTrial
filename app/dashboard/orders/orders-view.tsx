"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Task } from "@/lib/notion/types";
import { OrderDrawer } from "./_components/order-drawer";

type Tab = "review" | "in_progress" | "all";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function tabFilter(tab: Tab, t: Task): boolean {
  if (tab === "review") return t.needsClientInput;
  if (tab === "in_progress") return t.stage === "in_progress" || t.stage === "queued";
  return true;
}

export function OrdersView({ tasks }: { tasks: Task[] }) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("review");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [limit, setLimit] = useState(5);
  const [approving, setApproving] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deep-link / overview link can request a specific order drawer via ?open=.
  useEffect(() => {
    const open = searchParams.get("open");
    if (open) setSelectedId(open);
  }, [searchParams]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedId) ?? null,
    [tasks, selectedId],
  );

  const reviewCount = useMemo(() => tasks.filter((t) => t.needsClientInput).length, [tasks]);
  const filtered = useMemo(() => tasks.filter((t) => tabFilter(tab, t)), [tasks, tab]);
  const visible = filtered.slice(0, limit);

  async function quickApprove(taskId: string) {
    setApproving(taskId);
    setNotice(null);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, decision: "approve" }),
      });
      const data = await res.json();
      setNotice(res.ok ? "Approved." : (data.error ?? "Could not approve."));
    } catch {
      setNotice("Network error.");
    } finally {
      setApproving(null);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "review", label: "To Review" },
    { id: "in_progress", label: "In Progress" },
    { id: "all", label: "All Orders" },
  ];

  return (
    <div>
      <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 mb-6 max-w-md">
        <p className="text-sm text-gray-500">Orders to Review</p>
        <p className="text-3xl font-bold text-red-600 mt-1">{reviewCount}</p>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setLimit(5); }}
              className={`pb-3 text-sm transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-brand text-ink font-medium"
                  : "border-transparent text-gray-500 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 pb-2">
          {(["list", "calendar"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
                view === v ? "bg-brand-soft text-brand font-medium" : "text-gray-500 hover:text-ink"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p className="mt-4 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}

      {view === "calendar" ? (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
          Calendar view is coming soon.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {visible.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
              No orders in this view.
            </div>
          )}

          {visible.map((t) => (
            <div key={t.id} className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-48 shrink-0 text-sm text-gray-500">{t.category ?? "—"}</div>
                <div className="flex-1 min-w-0 font-medium text-ink truncate">{t.name}</div>
                <div className="w-24 shrink-0 text-sm text-gray-500">{formatDate(t.dueDate)}</div>
                <button
                  onClick={() => setSelectedId(t.id)}
                  className="bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
                >
                  Review
                </button>
                <button
                  onClick={() => quickApprove(t.id)}
                  disabled={approving === t.id}
                  className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Quick Approve
                </button>
                <button
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  className="text-gray-400 hover:text-ink p-1"
                  aria-label="Toggle details"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`transition-transform ${expanded === t.id ? "rotate-180" : ""}`}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>

              {expanded === t.id && (
                <div className="border-t border-gray-100 px-5 py-3 grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
                  <span className="text-gray-400">Delivery ID</span>
                  <span className="text-gray-700">{t.deliveryId ?? "—"}</span>
                  <span className="text-gray-400">Status</span>
                  <span className="text-gray-700">{t.rawStatus ?? "—"}</span>
                  <span className="text-gray-400">SKU</span>
                  <span className="text-gray-700">{t.sku ?? "—"}</span>
                </div>
              )}
            </div>
          ))}

          {limit < filtered.length && (
            <div className="text-center pt-2">
              <button
                onClick={() => setLimit((l) => l + 10)}
                className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                See more
              </button>
            </div>
          )}
        </div>
      )}

      <OrderDrawer task={selectedTask} onClose={() => setSelectedId(null)} />
    </div>
  );
}
