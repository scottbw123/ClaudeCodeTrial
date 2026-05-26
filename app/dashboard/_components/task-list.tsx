import Link from "next/link";
import type { Task } from "@/lib/notion/types";
import { StageBadge } from "./stage-badge";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-sm text-gray-400">
        No deliverables match these filters.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/dashboard/tasks/${task.id}`}
          className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{task.name}</span>
              {task.needsClientInput && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-white uppercase tracking-wide">
                  Action
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {task.projectName ?? "No project"} · Due {formatDate(task.dueDate)}
            </p>
          </div>
          <StageBadge stage={task.stage} />
        </Link>
      ))}
    </div>
  );
}
