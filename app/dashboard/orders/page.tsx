import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClientById, getTasksForClient } from "@/lib/notion/data";
import { OrdersView } from "./orders-view";

export const metadata: Metadata = { title: "Orders · OmniFlow" };

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const client = await getClientById(session.clientId);
  if (!client) {
    return <p className="text-sm text-gray-500">We couldn&apos;t load your client record.</p>;
  }

  let tasks;
  try {
    tasks = await getTasksForClient(client.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load data.";
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Couldn&apos;t reach Notion</p>
        <p className="text-amber-800">{message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Orders</h1>
      <hr className="border-gray-200 mb-6" />
      <OrdersView tasks={tasks} />
    </div>
  );
}
