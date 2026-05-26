/**
 * Central configuration for the Notion connection.
 *
 * The dashboard talks to ONE Notion workspace via a single integration token
 * (server-side secret). Per-client scoping happens in the app layer (auth +
 * relation filters), never by handing clients Notion access.
 *
 * Data-source IDs below are the real OmniFlow workspace defaults, discovered
 * during setup. They can be overridden per-environment via env vars so this
 * never has to be the source of truth in code.
 */

export const notionConfig = {
  token: process.env.NOTION_TOKEN ?? "",
  // Notion's data-source API (multi-source databases). Override only if Notion
  // changes the supported version.
  version: process.env.NOTION_VERSION ?? "2025-09-03",
  baseUrl: "https://api.notion.com/v1",

  dataSources: {
    /** CRM — one page per client (Company, Contact Email, approval prefs, …). */
    clients: process.env.NOTION_DS_CRM ?? "ec316d3a-aab7-4e1a-a5d5-47b53609f0cb",
    /** Aggregated Fulfillment — the unified deliverables/tasks ("orders") table. */
    tasks: process.env.NOTION_DS_TASKS ?? "2ea366b4-3c25-8160-b1c2-000bea383912",
    /** Projects — groupings of deliverables. */
    projects: process.env.NOTION_DS_PROJECTS ?? "703f1b14-04fa-40c2-80f1-418e4db49eb8",
    /** Team Roster — campaign managers / strategists (the client's contacts). */
    team: process.env.NOTION_DS_TEAM ?? "2a105b9e-f9b7-4365-b22f-2f349f7f5111",
    /** SKU catalog — product names referenced by orders. */
    skus: process.env.NOTION_DS_SKUS ?? "0f384c80-19db-4f18-83d7-43a1004b47b3",
  },

  // Not yet wired, but discovered and reserved for upcoming phases:
  //  - Client Dashboard DB:        20f366b4-3c25-8009-891e-000b8075e4e6
  //  - Client Feedback (Softr) DB: 35a366b4-3c25-8004-8a93-000ba3d9009f
} as const;

/**
 * Property-name mapping. Notion property names are the contract between the
 * dashboard and the workspace; keeping them here (not scattered through the
 * code) means a workspace rename is a one-line change.
 */
export const props = {
  client: {
    name: "Company",
    email: "Contact Email",
    clientId: "Client ID",
    status: "Status",
    workType: "Work Type",
    website: "Website",
    lookerReport: "Looker Report",
    clientFolder: "Client Folder",
    monthlyBudget: "Monthly Budget",
    campaignManager: "Campaign Manager",
    skipContentApproval: "Skip Content Approval",
    skipContentStrategyApproval: "Skip Content Strategy Approval",
    projects: "Projects",
  },
  task: {
    name: "Name",
    status: "Product Status ⚡",
    dueDate: "Due Date",
    startDate: "Start Date",
    client: "CRM",
    project: "Projects",
    requiresInput: "Requires Input",
    clientDeliveryUrl: "Client Delivery URL",
    clientDoc: "Client Doc",
    pageType: "Page Type",
    primaryKeyword: "Primary Keyword",
    softrApproval: "Softr Approval",
    softrFeedback: "Softr Feedback",
    taskId: "Task ID", // rendered as the "Delivery ID" (WO-####)
    sku: "SKUs", // relation -> SKU catalog; resolved to a title
    // "To review" = this property's text contains "Client".
    statusCollation: "Status Collation",
    // Best-effort source for the list "category" column; refine once live.
    category: "Target Category",
    label: "Label",
  },
  team: {
    name: "Name",
    position: "Position",
    email: "Client-Facing Email",
    calendly: "Personal Calendly",
  },
  project: {
    name: "Project name",
    status: "Status",
    priority: "Priority",
    startDate: "Start Date",
    client: "Client",
    tasks: "Aggregated Fulfillment",
  },
} as const;

/**
 * Client-visible property allowlist. ONLY fields listed here are ever projected
 * into a client's dashboard payload — curated, not a raw dump of Notion. Extend
 * deliberately as the dashboard workflow grows.
 */
export const clientVisibleTaskFields = [
  "name",
  "stage",
  "dueDate",
  "projectName",
  "needsClientInput",
  "clientDeliveryUrl",
] as const;

export function assertNotionConfigured(): void {
  if (!notionConfig.token) {
    throw new Error(
      "NOTION_TOKEN is not set. Create a Notion internal integration, share the " +
        "CRM / Aggregated Fulfillment / Projects databases with it, and set NOTION_TOKEN.",
    );
  }
}
