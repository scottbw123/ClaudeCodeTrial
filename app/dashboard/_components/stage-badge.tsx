import type { ClientStage } from "@/lib/notion/types";
import { STAGE_LABELS } from "@/lib/notion/types";

const STAGE_STYLES: Record<ClientStage, string> = {
  queued: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-800",
  needs_your_review: "bg-amber-100 text-amber-800",
  approved: "bg-indigo-100 text-indigo-800",
  complete: "bg-emerald-100 text-emerald-800",
  canceled: "bg-red-50 text-red-600",
};

export function StageBadge({ stage }: { stage: ClientStage }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${STAGE_STYLES[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
