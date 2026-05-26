import { notionConfig, assertNotionConfigured } from "./config";

/**
 * Minimal server-side Notion REST client. Kept dependency-free and transparent
 * on purpose — we control exactly which endpoints and API version we hit.
 *
 * NEVER import this from a Client Component: it reads NOTION_TOKEN.
 */

export interface NotionPage {
  id: string;
  url?: string;
  properties: Record<string, NotionProperty>;
  [key: string]: unknown;
}

// Loose Notion property shape. We read it through helpers in properties.ts.
export interface NotionProperty {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface QueryResponse {
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
}

async function notionFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  assertNotionConfigured();

  const res = await fetch(`${notionConfig.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${notionConfig.token}`,
      "Notion-Version": notionConfig.version,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    // Caching is handled at the data-access layer via unstable_cache; the raw
    // fetch stays uncached (Next's default) so it doesn't fight that layer.
  });

  if (!res.ok) {
    const body = await res.text();
    throw new NotionError(res.status, body);
  }

  return res.json() as Promise<T>;
}

export class NotionError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Notion API error ${status}: ${body.slice(0, 500)}`);
    this.name = "NotionError";
  }
}

export interface QueryOptions {
  filter?: unknown;
  sorts?: unknown[];
  pageSize?: number;
  /** Cap total pages fetched so a misconfigured filter can't pull the world. */
  maxPages?: number;
}

/**
 * Query a data source, transparently following pagination.
 */
export async function queryDataSource(
  dataSourceId: string,
  options: QueryOptions = {},
): Promise<NotionPage[]> {
  const { filter, sorts, pageSize = 100, maxPages = 20 } = options;
  const results: NotionPage[] = [];
  let cursor: string | null = null;
  let pages = 0;

  do {
    const body: Record<string, unknown> = { page_size: pageSize };
    if (filter) body.filter = filter;
    if (sorts) body.sorts = sorts;
    if (cursor) body.start_cursor = cursor;

    const data: QueryResponse = await notionFetch<QueryResponse>(
      `/data_sources/${dataSourceId}/query`,
      { method: "POST", body: JSON.stringify(body) },
    );

    results.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
    pages += 1;
  } while (cursor && pages < maxPages);

  return results;
}

export async function getPage(pageId: string): Promise<NotionPage> {
  return notionFetch<NotionPage>(`/pages/${pageId}`);
}

export async function updatePageProperties(
  pageId: string,
  properties: Record<string, unknown>,
): Promise<NotionPage> {
  return notionFetch<NotionPage>(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });
}

/** Connection probe used by the health route. */
export async function getBotUser(): Promise<{ id: string; name?: string }> {
  return notionFetch<{ id: string; name?: string }>("/users/me");
}
