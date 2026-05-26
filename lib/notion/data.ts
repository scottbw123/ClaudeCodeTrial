import { cache } from "react";
import { notionConfig, props } from "./config";
import { getPage, queryDataSource } from "./client";
import { mapClient, mapProject, mapTask } from "./map";
import { readRelationIds } from "./properties";
import type { ClientRecord, DashboardData, Project, Task } from "./types";

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
    const [taskPages, projects] = await Promise.all([
      queryDataSource(notionConfig.dataSources.tasks, {
        filter: {
          property: props.task.client,
          relation: { contains: clientPageId },
        },
      }),
      getProjectsForClient(clientPageId),
    ]);

    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    return taskPages.map((page) => mapTask(page, projectNames));
  },
);

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
