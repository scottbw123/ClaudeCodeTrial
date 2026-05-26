"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface ClientOption {
  id: string;
  name: string;
  email: string | null;
  statuses: string[];
}

export function ClientPicker({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.email ?? "").toLowerCase().includes(term),
    );
  }, [clients, q]);

  async function viewAs(id: string) {
    setPending(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not open client.");
        setPending(null);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error.");
      setPending(null);
    }
  }

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search clients by name or email…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent mb-4"
      />

      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <p className="text-xs text-gray-400 mb-2">{filtered.length} clients</p>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No clients match.</p>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="font-medium text-ink truncate">{c.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {c.email ?? "no email"}
                {c.statuses.length > 0 && ` · ${c.statuses.join(", ")}`}
              </p>
            </div>
            <button
              onClick={() => viewAs(c.id)}
              disabled={pending === c.id}
              className="shrink-0 rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {pending === c.id ? "Opening…" : "View dashboard"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
