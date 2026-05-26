import { unstable_cache } from "next/cache";
import { notionConfig, props } from "./config";
import { getPage, queryDataSource } from "./client";
import { mapClient, mapContact, mapProject, mapTask } from "./map";
import { readRelationIds, readTitleAuto } from "./properties";
import type { Contact, ClientRecord, DashboardData, Project, Resource, Task } from "./types";

/**
 * All reads are scoped to a single client via Notion relation filters, and
 * cached across requests with `unstable_cache` so repeat navigations don't
 * re-hit Notion. Cache keys include the function arguments (e.g. clientId), so
 * each client gets its own entry. TTLs are short for live-ish data and long for
 * rarely-changing catalogs.
 *
 * NOTE: cached values must be JSON-serializable — return plain objects/arrays,
 * never Maps.
 */
const TTL = {
  client: 120,
  clients: 120,
  tasks: 45,
  projects: 45,
  contact: 600,
  titleMap: 3600,
} as const;

/** id -> title for a data source (plain object so it survives the cache). */
const getTitleMap = unstable_cache(
  async (dataSourceId: string): Promise<Record<string, string>> => {
    try {
      const pages = await queryDataSource(dataSourceId, { pageSize: 100, maxPages: 5 });
      const out: Record<string, string> = {};
      for (const p of pages) out[p.id] = readTitleAuto(p);
      return out;
    } catch {
      return {};
    }
  },
  ["notion-title-map"],
  { revalidate: TTL.titleMap },
);

/** Look up a client by their CRM "Contact Email". Used at login. */
export const findClientByEmail = unstable_cache(
  async (email: string): Promise<ClientRecord | null> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    const pages = await queryDataSource(notionConfig.dataSources.clients, {
      filter: { property: props.client.email, email: { equals: normalized } },
      pageSize: 1,
      maxPages: 1,
    });
    return pages[0] ? mapClient(pages[0]) : null;
  },
  ["notion-client-by-email"],
  { revalidate: TTL.client },
);

export const getClientById = unstable_cache(
  async (pageId: string): Promise<ClientRecord | null> => {
    try {
      return mapClient(await getPage(pageId));
    } catch {
      return null;
    }
  },
  ["notion-client-by-id"],
  { revalidate: TTL.client },
);

/** All loginable clients (those with a Contact Email), for the admin picker. */
export const getAllClients = unstable_cache(
  async (): Promise<ClientRecord[]> => {
    const pages = await queryDataSource(notionConfig.dataSources.clients, {
      filter: { property: props.client.email, email: { is_not_empty: true } },
      sorts: [{ property: props.client.name, direction: "ascending" }],
      maxPages: 10,
    });
    return pages.map(mapClient);
  },
  ["notion-all-clients"],
  { revalidate: TTL.clients },
);

export const getProjectsForClient = unstable_cache(
  async (clientPageId: string): Promise<Project[]> => {
    const pages = await queryDataSource(notionConfig.dataSources.projects, {
      filter: { property: props.project.client, relation: { contains: clientPageId } },
    });
    return pages.map(mapProject);
  },
  ["notion-projects-for-client"],
  { revalidate: TTL.projects },
);

export const getTasksForClient = unstable_cache(
  async (clientPageId: string): Promise<Task[]> => {
    const [taskPages, projects, skuNames] = await Promise.all([
      queryDataSource(notionConfig.dataSources.tasks, {
        filter: { property: props.task.client, relation: { contains: clientPageId } },
      }),
      getProjectsForClient(clientPageId),
      getTitleMap(notionConfig.dataSources.skus),
    ]);

    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    const skuMap = new Map(Object.entries(skuNames));
    return taskPages.map((page) => mapTask(page, { projectNames, skuNames: skuMap }));
  },
  ["notion-tasks-for-client"],
  { revalidate: TTL.tasks },
);

/** A single task, only if it belongs to the client (authorization check). */
export const getTaskForClient = unstable_cache(
  async (taskId: string, clientPageId: string): Promise<Task | null> => {
    let page;
    try {
      page = await getPage(taskId);
    } catch {
      return null;
    }
    if (!readRelationIds(page, props.task.client).includes(clientPageId)) return null;
    return mapTask(page);
  },
  ["notion-task-for-client"],
  { revalidate: TTL.tasks },
);

const getTeamMember = unstable_cache(
  async (pageId: string): Promise<Contact | null> => {
    try {
      return mapContact(await getPage(pageId));
    } catch {
      return null;
    }
  },
  ["notion-team-member"],
  { revalidate: TTL.contact },
);

/** The client's primary contact (campaign manager) for the "Contact" card. */
export async function getClientContact(client: ClientRecord): Promise<Contact | null> {
  if (!client.campaignManagerId) return null;
  return getTeamMember(client.campaignManagerId);
}

/** Curated resource links shown on the overview. */
export function getClientResources(client: ClientRecord): Resource[] {
  const resources: Resource[] = [];
  if (client.clientFolder) resources.push({ label: "View Campaign Folder", url: client.clientFolder });
  if (client.lookerReport) resources.push({ label: "Analytics Report", url: client.lookerReport });
  if (client.website) resources.push({ label: "Your Website", url: client.website });
  return resources;
}

export async function getDashboardData(client: ClientRecord): Promise<DashboardData> {
  const [tasks, projects] = await Promise.all([
    getTasksForClient(client.id),
    getProjectsForClient(client.id),
  ]);
  return { client, tasks, projects };
}
