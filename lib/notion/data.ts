import { cache } from "react";
import { notionConfig, props } from "./config";
import { getPage, queryDataSource } from "./client";
import { mapClient, mapContact, mapProject, mapTask } from "./map";
import { readRelationIds, readTitleAuto } from "./properties";
import type { Contact, ClientRecord, DashboardData, Project, Resource, Task } from "./types";

/** id -> title map for a data source, used to resolve relation labels cheaply. */
const getTitleMap = cache(async (dataSourceId: string): Promise<Map<string, string>> => {
  try {
    const pages = await queryDataSource(dataSourceId, { pageSize: 100, maxPages: 5 });
    return new Map(pages.map((p) => [p.id, readTitleAuto(p)]));
  } catch {
    return new Map();
  }
});

/**
 * All reads are scoped to a single client via Notion relation filters. The
 * caller is responsible for passing the authenticated client's page id — never
 * trust a client id from the request body.
 */

/** Look up a client by their CRM "Contact Email". Used at login. */
export const findClientByEmail = cache(
  async (email: string): Promise<ClientRecord | null> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const pages = await queryDataSource(notionConfig.dataSources.clients, {
      filter: {
        property: props.client.email,
        email: { equals: normalized },
      },
      pageSize: 1,
      maxPages: 1,
    });

    return pages[0] ? mapClient(pages[0]) : null;
  },
);

export const getClientById = cache(
  async (pageId: string): Promise<ClientRecord | null> => {
    try {
      return mapClient(await getPage(pageId));
    } catch {
      return null;
    }
  },
);

/** All loginable clients (those with a Contact Email), for the admin picker. */
export const getAllClients = cache(async (): Promise<ClientRecord[]> => {
  const pages = await queryDataSource(notionConfig.dataSources.clients, {
    filter: { property: props.client.email, email: { is_not_empty: true } },
    sorts: [{ property: props.client.name, direction: "ascending" }],
    maxPages: 10,
  });
  return pages.map(mapClient);
});

export const getProjectsForClient = cache(
  async (clientPageId: string): Promise<Project[]> => {
    const pages = await queryDataSource(notionConfig.dataSources.projects, {
      filter: {
        property: props.project.client,
        relation: { contains: clientPageId },
      },
    });
    return pages.map(mapProject);
  },
);

export const getTasksForClient = cache(
  async (clientPageId: string): Promise<Task[]> => {
    const [taskPages, projects, skuNames] = await Promise.all([
      queryDataSource(notionConfig.dataSources.tasks, {
        filter: {
          property: props.task.client,
          relation: { contains: clientPageId },
        },
      }),
      getProjectsForClient(clientPageId),
      getTitleMap(notionConfig.dataSources.skus),
    ]);

    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    return taskPages.map((page) => mapTask(page, { projectNames, skuNames }));
  },
);

/** The client's primary contact (campaign manager) for the "Contact" card. */
export const getClientContact = cache(
  async (client: ClientRecord): Promise<Contact | null> => {
    if (!client.campaignManagerId) return null;
    try {
      return mapContact(await getPage(client.campaignManagerId));
    } catch {
      return null;
    }
  },
);

/** Curated resource links shown on the overview. */
export function getClientResources(client: ClientRecord): Resource[] {
  const resources: Resource[] = [];
  if (client.clientFolder) resources.push({ label: "View Campaign Folder", url: client.clientFolder });
  if (client.lookerReport) resources.push({ label: "Analytics Report", url: client.lookerReport });
  if (client.website) resources.push({ label: "Your Website", url: client.website });
  return resources;
}

/**
 * Fetch a single task ONLY if it belongs to the given client. Returns null
 * otherwise — this is the authorization check for the detail route.
 */
export const getTaskForClient = cache(
  async (taskId: string, clientPageId: string): Promise<Task | null> => {
    let page;
    try {
      page = await getPage(taskId);
    } catch {
      return null;
    }
    const owners = readRelationIds(page, props.task.client);
    if (!owners.includes(clientPageId)) return null;
    return mapTask(page);
  },
);

export async function getDashboardData(client: ClientRecord): Promise<DashboardData> {
  const [tasks, projects] = await Promise.all([
    getTasksForClient(client.id),
    getProjectsForClient(client.id),
  ]);
  return { client, tasks, projects };
}
