import type { NotionPage } from "./client";
import { props } from "./config";
import {
  readCheckbox,
  readDate,
  readEmail,
  readMultiSelect,
  readNumber,
  readRelationIds,
  readRichText,
  readSelect,
  readStatus,
  readTitle,
  readUrl,
} from "./properties";
import type { ClientRecord, ClientStage, Project, Task } from "./types";

/**
 * Collapse the ~80-value internal "Product Status ⚡" workflow into the small
 * set of stages a client should see. Matching is keyword-based so new internal
 * statuses degrade gracefully instead of vanishing.
 *
 * NOTE: this is a first-pass mapping. The exact internal→client stage rules are
 * a workflow decision to refine with the team.
 */
export function mapProductStatusToStage(raw: string | null): ClientStage {
  if (!raw) return "queued";
  const s = raw.toLowerCase();

  if (s === "canceled" || s.includes("cancel") || s.includes("deactivat")) {
    return "canceled";
  }
  if (
    s === "complete" ||
    s === "published" ||
    s === "launched" ||
    s === "released" ||
    s === "activated" ||
    s.includes("complete")
  ) {
    return "complete";
  }
  if (s === "approved") return "approved";
  // Anything explicitly in front of the client for sign-off / input.
  if (s.includes("client") && (s.includes("review") || s.includes("qc") || s.includes("writing"))) {
    return "needs_your_review";
  }
  if (s === "queued" || s === "preparation" || s === "brief" || s === "order submitted") {
    return "queued";
  }
  return "in_progress";
}

/** Statuses where the client is the actor we're waiting on. */
function clientIsBlocking(rawStatus: string | null, requiresInput: string | null): boolean {
  if (requiresInput && requiresInput.toLowerCase().includes("client")) return true;
  if (!rawStatus) return false;
  const s = rawStatus.toLowerCase();
  return s.includes("client") && (s.includes("review") || s.includes("qc") || s.includes("writing"));
}

export function mapClient(page: NotionPage): ClientRecord {
  return {
    id: page.id,
    name: readTitle(page, props.client.name) || "Untitled client",
    email: readEmail(page, props.client.email),
    clientId: readNumber(page, props.client.clientId),
    statuses: readMultiSelect(page, props.client.status),
    workTypes: readMultiSelect(page, props.client.workType),
    website: readUrl(page, props.client.website),
    approvalPrefs: {
      skipContentApproval: readCheckbox(page, props.client.skipContentApproval),
      skipContentStrategyApproval: readCheckbox(
        page,
        props.client.skipContentStrategyApproval,
      ),
    },
  };
}

export function mapTask(
  page: NotionPage,
  projectNames: Map<string, string> = new Map(),
): Task {
  const rawStatus = readStatus(page, props.task.status);
  const requiresInput = readSelect(page, props.task.requiresInput);
  const projectId = readRelationIds(page, props.task.project)[0] ?? null;

  return {
    id: page.id,
    name: readTitle(page, props.task.name) || "Untitled deliverable",
    rawStatus,
    stage: mapProductStatusToStage(rawStatus),
    dueDate: readDate(page, props.task.dueDate),
    startDate: readDate(page, props.task.startDate),
    projectId,
    projectName: projectId ? (projectNames.get(projectId) ?? null) : null,
    needsClientInput: clientIsBlocking(rawStatus, requiresInput),
    clientDeliveryUrl: readUrl(page, props.task.clientDeliveryUrl),
  };
}

export function mapProject(page: NotionPage): Project {
  return {
    id: page.id,
    name: readTitle(page, props.project.name) || readRichText(page, props.project.name) || "Untitled project",
    status: readStatus(page, props.project.status),
    priority: readSelect(page, props.project.priority),
    startDate: readDate(page, props.project.startDate),
    taskCount: readRelationIds(page, props.project.tasks).length,
  };
}
