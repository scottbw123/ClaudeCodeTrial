const ENDPOINT = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced";

export interface SerpItem {
  rank: number; // absolute rank in SERP including SERP features
  rankGroup?: number; // rank within organic results
  url: string;
  domain: string;
  title: string;
  description: string;
}

interface DfsTask {
  status_code: number;
  status_message: string;
  result?: Array<{
    items?: Array<{
      type: string;
      rank_absolute: number;
      rank_group?: number;
      url?: string;
      domain?: string;
      title?: string;
      description?: string;
    }>;
  }>;
}

interface DfsResponse {
  status_code: number;
  status_message: string;
  tasks?: DfsTask[];
}

export interface SerpQuery {
  keyword: string;
  locationCode?: number; // default 2840 (US)
  languageCode?: string; // default "en"
  depth?: number; // default 10
  device?: "desktop" | "mobile"; // default desktop
}

export async function fetchSerp(query: SerpQuery): Promise<SerpItem[]> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set");
  }
  const auth = Buffer.from(`${login}:${password}`).toString("base64");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        keyword: query.keyword,
        location_code: query.locationCode ?? 2840,
        language_code: query.languageCode ?? "en",
        depth: query.depth ?? 10,
        device: query.device ?? "desktop",
      },
    ]),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DataForSEO request failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as DfsResponse;
  if (data.status_code >= 40000) {
    throw new Error(`DataForSEO error: ${data.status_message}`);
  }
  const task = data.tasks?.[0];
  if (!task || task.status_code >= 40000) {
    throw new Error(`DataForSEO task error: ${task?.status_message ?? "unknown"}`);
  }
  const items = task.result?.[0]?.items ?? [];
  return items
    .filter((i) => i.type === "organic" && i.url)
    .map((i) => ({
      rank: i.rank_absolute,
      rankGroup: i.rank_group,
      url: i.url as string,
      domain: i.domain ?? new URL(i.url as string).hostname,
      title: i.title ?? "",
      description: i.description ?? "",
    }));
}

/**
 * Returns the SERP items ranking above the user's page for the given keyword.
 * If the user's page isn't in the returned SERP, all items are returned.
 */
export function competitorsAbove(items: SerpItem[], userPageUrl: string): {
  userRank: number | null;
  competitors: SerpItem[];
} {
  const normalize = (u: string) => {
    try {
      const url = new URL(u);
      return (url.hostname + url.pathname.replace(/\/$/, "")).toLowerCase();
    } catch {
      return u.toLowerCase();
    }
  };
  const userKey = normalize(userPageUrl);
  const idx = items.findIndex((i) => normalize(i.url) === userKey);
  if (idx === -1) {
    return { userRank: null, competitors: items };
  }
  return { userRank: items[idx].rank, competitors: items.slice(0, idx) };
}
