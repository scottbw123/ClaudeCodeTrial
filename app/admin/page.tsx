import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { getAllClients } from "@/lib/notion/data";
import { ClientPicker } from "./client-picker";

export const metadata: Metadata = { title: "Admin · Client Preview" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await getAdminSession())) redirect("/admin/login");

  let clients;
  try {
    clients = await getAllClients();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load clients.";
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-sm text-amber-900">
          <p className="font-semibold mb-1">Couldn&apos;t reach Notion</p>
          <p className="text-amber-800">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl text-ink mb-1">Client Preview</h1>
      <p className="text-sm text-gray-500 mb-6">
        Select a client to view their dashboard exactly as they will see it.
      </p>
      <ClientPicker
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          statuses: c.statuses,
        }))}
      />
    </main>
  );
}
