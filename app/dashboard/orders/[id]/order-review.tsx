"use client";

import Link from "next/link";
import { useState } from "react";
import type { Task } from "@/lib/notion/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3 border-t border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  );
}

export function OrderReview({ task }: { task: Task }) {
  const [tab, setTab] = useState<"information" | "comments">("information");
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submitDecision(decision: "approve" | "request_changes") {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, decision, note: note.trim() || undefined }),
      });
      const data = await res.json();
      setNotice(res.ok ? "Submitted." : (data.error ?? "Could not submit."));
    } catch {
      setNotice("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment() {
    if (!comment.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, text: comment.trim() }),
      });
      const data = await res.json();
      setNotice(res.ok ? "Comment posted." : (data.error ?? "Could not post comment."));
      if (res.ok) setComment("");
    } catch {
      setNotice("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link href="/dashboard/orders" className="text-sm text-gray-500 hover:text-ink transition-colors">
        ← Back to orders
      </Link>
      <h1 className="font-display text-3xl text-ink mt-3 mb-1">Order Review</h1>
      <hr className="border-gray-200 mb-6" />

      {task.needsClientInput && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-300 px-4 py-3 text-sm text-red-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16v.01" />
          </svg>
          This order requires review.
        </div>
      )}

      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {(["information", "comments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-brand text-ink font-medium" : "border-transparent text-gray-500 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {notice && (
        <p className="mb-4 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}

      {tab === "information" ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4">
            <h2 className="font-display text-lg text-ink">{task.name}</h2>
          </div>
          <InfoRow label="Due Date" value={formatDate(task.dueDate)} />
          <InfoRow label="SKU" value={task.sku ?? "—"} />
          <InfoRow label="Status" value={task.rawStatus ?? "—"} />
          <InfoRow label="Start Date" value={formatDate(task.startDate)} />
          <InfoRow label="Delivery ID" value={task.deliveryId ?? "—"} />
          {task.clientDeliveryUrl && (
            <InfoRow
              label="Deliverable"
              value={
                <a href={task.clientDeliveryUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  Open
                </a>
              }
            />
          )}

          <div className="px-5 py-4 border-t border-gray-100">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for the team…"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => submitDecision("approve")}
                disabled={busy}
                className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => submitDecision("request_changes")}
                disabled={busy}
                className="rounded-md border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-ink">Comments</h2>
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
              Notifications
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="rounded border-gray-300 text-brand focus:ring-brand"
              />
            </label>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Visible to your account team. Separate from internal notes.
          </p>
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-400 mb-4">
            No comments yet.
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment…"
              rows={2}
              className="w-full bg-transparent text-sm focus:outline-none resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={submitComment}
                disabled={busy || !comment.trim()}
                className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
