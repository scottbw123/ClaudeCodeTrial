"use client";

import { useState } from "react";

/**
 * Client-facing actions for a deliverable: approve / request changes, and leave
 * a comment. These post to the /api/approvals and /api/comments seams, which
 * are stubbed (501) until the exact workflows are defined. The UI surfaces
 * whatever the server returns so the wiring is visible end-to-end.
 */
export function DeliverablePanel({
  taskId,
  needsClientInput,
}: {
  taskId: string;
  needsClientInput: boolean;
}) {
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitDecision(decision: "approve" | "request_changes") {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, decision, note: note.trim() || undefined }),
      });
      const data = await res.json();
      setStatus(res.ok ? "Submitted." : (data.error ?? "Could not submit."));
    } catch {
      setStatus("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment() {
    if (!comment.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, text: comment.trim() }),
      });
      const data = await res.json();
      setStatus(res.ok ? "Comment posted." : (data.error ?? "Could not post comment."));
    } catch {
      setStatus("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900">
          Your review
          {needsClientInput && (
            <span className="ml-2 text-xs font-normal text-amber-600">· awaiting your input</span>
          )}
        </h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for the team…"
          rows={2}
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => submitDecision("approve")}
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => submitDecision("request_changes")}
            disabled={busy}
            className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Request changes
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900">Comments</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Visible to your account team. Separate from internal notes.
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={submitComment}
          disabled={busy || !comment.trim()}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Post comment
        </button>
      </section>

      {status && (
        <p className="text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
          {status}
        </p>
      )}
    </div>
  );
}
