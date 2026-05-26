import type { NotionPage } from "./client";
import { props } from "./config";
import {
  readCheckbox,
  readDate,
  readEmail,
  readMultiSelect,
  readNumber,
  readPlainText,
  readRelationIds,
  readRichText,
  readSelect,
  readStatus,
  readTitle,
  readUrl,
} from "./properties";
import type { ClientRecord, ClientStage, Contact, Project, Task } from "./types";

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

/**
 * An order needs the client's review when its "Status Collation" value mentions
 * the client (e.g. "Client Review"). Defined by the team's workflow.
 */
function needsClientReview(page: NotionPage): boolean {
  return readPlainText(page, props.task.statusCollation).toLowerCase().includes("client");
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
    lookerReport: readUrl(page, props.client.lookerReport),
    clientFolder: readUrl(page, props.client.clientFolder),
    campaignManagerId: readRelationIds(page, props.client.campaignManager)[0] ?? null,
    approvalPrefs: {
      skipContentApproval: readCheckbox(page, props.client.skipContentApproval),
      skipContentStrategyApproval: readCheckbox(
        page,
        props.client.skipContentStrategyApproval,
      ),
    },
  };
}

export function mapContact(page: NotionPage): Contact {
  return {
    name: readTitle(page, props.team.name) || "Your team",
    role: readSelect(page, props.team.position),
    email: readEmail(page, props.team.email),
    bookingUrl: readUrl(page, props.team.calendly),
  };
}

export interface MapTaskContext {
  projectNames?: Map<string, string>;
  skuNames?: Map<string, string>;
}

export function mapTask(page: NotionPage, ctx: MapTaskContext = {}): Task {
  const rawStatus = readStatus(page, props.task.status);
  const projectId = readRelationIds(page, props.task.project)[0] ?? null;
  const skuId = readRelationIds(page, props.task.sku)[0] ?? null;
  const taskId = readNumber(page, props.task.taskId);
  const projectName = projectId ? (ctx.projectNames?.get(projectId) ?? null) : null;
  const sku = skuId ? (ctx.skuNames?.get(skuId) ?? null) : null;

  // "Category" source is best-effort until confirmed; degrade sensibly.
  const category =
    readSelect(page, props.task.category) ||
    readRichText(page, props.task.category) ||
    readRichText(page, props.task.label) ||
    sku ||
    projectName;

  return {
    id: page.id,
    name: readTitle(page, props.task.name) || "Untitled deliverable",
    rawStatus,
    stage: mapProductStatusToStage(rawStatus),
    dueDate: readDate(page, props.task.dueDate),
    startDate: readDate(page, props.task.startDate),
    projectId,
    projectName,
    category,
    sku,
    deliveryId: taskId != null ? `WO-${taskId}` : null,
    needsClientInput: needsClientReview(page),
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
