/**
 * Domain types — the normalized, client-safe shapes the dashboard renders.
 * These intentionally hide the sprawl of the underlying Notion schema.
 */

/**
 * Simplified, client-facing lifecycle. The raw "Product Status ⚡" field has
 * 80+ internal states; we collapse them into a handful clients understand.
 */
export type ClientStage =
  | "queued"
  | "in_progress"
  | "needs_your_review"
  | "approved"
  | "complete"
  | "canceled";

export const CLIENT_STAGES: ClientStage[] = [
  "queued",
  "in_progress",
  "needs_your_review",
  "approved",
  "complete",
  "canceled",
];

export const STAGE_LABELS: Record<ClientStage, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  needs_your_review: "Needs Your Review",
  approved: "Approved",
  complete: "Complete",
  canceled: "Canceled",
};

export interface ClientRecord {
  id: string; // Notion page id
  name: string;
  email: string | null;
  clientId: number | null;
  statuses: string[];
  workTypes: string[];
  website: string | null;
  approvalPrefs: {
    skipContentApproval: boolean;
    skipContentStrategyApproval: boolean;
  };
}

export interface Task {
  id: string;
  name: string;
  rawStatus: string | null;
  stage: ClientStage;
  dueDate: string | null; // ISO date
  startDate: string | null;
  projectId: string | null;
  projectName: string | null;
  needsClientInput: boolean;
  clientDeliveryUrl: string | null;
}

export interface Project {
  id: string;
  name: string;
  status: string | null;
  priority: string | null;
  startDate: string | null;
  taskCount: number;
}

export interface DashboardData {
  client: ClientRecord;
  tasks: Task[];
  projects: Project[];
}
