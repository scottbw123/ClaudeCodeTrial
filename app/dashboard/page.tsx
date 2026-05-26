import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClientById, getDashboardData } from "@/lib/notion/data";
import type { Task } from "@/lib/notion/types";
import { DashboardFilters } from "./_components/dashboard-filters";
import { TaskList } from "./_components/task-list";

export const metadata: Metadata = {
  title: "Dashboard · Client Dashboard",
};

interface SearchParams {
  stage?: string;
  project?: string;
  q?: string;
  needsInput?: string;
}

function applyFilters(tasks: Task[], sp: SearchParams): Task[] {
  return tasks.filter((t) => {
    if (sp.stage && t.stage !== sp.stage) return false;
    if (sp.project && t.projectId !== sp.project) return false;
    if (sp.needsInput === "1" && !t.needsClientInput) return false;
    if (sp.q && !t.name.toLowerCase().includes(sp.q.toLowerCase())) return false;
    return true;
  });
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
      <p className={`text-2xl font-bold ${accent ?? "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const client = await getClientById(session.clientId);
  if (!client) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-500">
        We couldn&apos;t load your client record. Please contact your account manager.
      </div>
    );
  }

  let data;
  try {
    data = await getDashboardData(client);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load data.";
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Couldn&apos;t reach Notion</p>
        <p className="text-amber-800">{message}</p>
      </div>
    );
  }

  const sp = await searchParams;
  const filtered = applyFilters(data.tasks, sp);

  const needsReview = data.tasks.filter((t) => t.needsClientInput).length;
  const inProgress = data.tasks.filter((t) => t.stage === "in_progress").length;
  const complete = data.tasks.filter((t) => t.stage === "complete").length;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Total deliverables" value={data.tasks.length} />
        <Stat label="Needs your review" value={needsReview} accent="text-amber-600" />
        <Stat label="In progress" value={inProgress} accent="text-blue-600" />
        <Stat label="Complete" value={complete} accent="text-emerald-600" />
      </div>

      <DashboardFilters projects={data.projects.map((p) => ({ id: p.id, name: p.name }))} />

      <p className="text-xs text-gray-400 mb-2">
        Showing {filtered.length} of {data.tasks.length} deliverables
      </p>
      <TaskList tasks={filtered} />
    </div>
  );
}
