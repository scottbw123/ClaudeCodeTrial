import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getTaskForClient } from "@/lib/notion/data";
import { StageBadge } from "../../_components/stage-badge";
import { DeliverablePanel } from "./deliverable-panel";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3">
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const task = await getTaskForClient(id, session.clientId);
  if (!task) notFound();

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
        ← Back to dashboard
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{task.name}</h1>
        <StageBadge stage={task.stage} />
      </div>

      <div className="mt-5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        <Field label="Project">{task.projectName ?? "—"}</Field>
        <Field label="Due date">{formatDate(task.dueDate)}</Field>
        <Field label="Delivery">
          {task.clientDeliveryUrl ? (
            <a
              href={task.clientDeliveryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              View deliverable
            </a>
          ) : (
            "Not yet available"
          )}
        </Field>
      </div>

      <DeliverablePanel taskId={task.id} needsClientInput={task.needsClientInput} />
    </div>
  );
}
