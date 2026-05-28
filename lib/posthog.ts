// PostHog REST + HogQL client. Auth is a Personal API key set in .env.local;
// the same key sees every project the user/account can reach via PostHog's
// org membership.

export interface PosthogProject {
  organizationId: string;
  organizationName: string;
  projectId: string;
  projectName: string;
}

export type HogQLValue = string | number | boolean | null | HogQLValue[];

export interface HogQLResult {
  columns: string[];
  results: HogQLValue[][];
}

function creds(): { host: string; key: string } {
  const host = process.env.POSTHOG_HOST?.replace(/\/+$/, "") || "https://us.posthog.com";
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) {
    throw new Error("Missing POSTHOG_PERSONAL_API_KEY. Add it to .env.local (see https://us.posthog.com/settings/user-api-keys).");
  }
  return { host, key };
}

async function ph<T>(path: string, init?: RequestInit): Promise<T> {
  const { host, key } = creds();
  const res = await fetch(`${host}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PostHog ${path} → ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
  }
  return res.json() as Promise<T>;
}

interface OrgResp {
  results: { id: string; name: string }[];
}
interface ProjResp {
  results: { id: number; name: string }[];
}

export async function listPosthogProjects(): Promise<PosthogProject[]> {
  const orgs = await ph<OrgResp>("/api/organizations/");
  const out: PosthogProject[] = [];
  for (const org of orgs.results) {
    const projects = await ph<ProjResp>(`/api/organizations/${org.id}/projects/`);
    for (const p of projects.results) {
      out.push({
        organizationId: org.id,
        organizationName: org.name,
        projectId: String(p.id),
        projectName: p.name,
      });
    }
  }
  return out;
}

interface QueryResp {
  results: HogQLValue[][];
  columns?: string[];
  types?: string[];
}

export async function runHogQL(opts: { projectId: string; query: string }): Promise<HogQLResult> {
  const body = { query: { kind: "HogQLQuery", query: opts.query } };
  const resp = await ph<QueryResp>(`/api/projects/${opts.projectId}/query/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { columns: resp.columns ?? [], results: resp.results ?? [] };
}

export async function runHogQLMultiProject(opts: { projectIds: string[]; query: string }): Promise<HogQLResult> {
  if (opts.projectIds.length === 0) return { columns: [], results: [] };
  if (opts.projectIds.length === 1) return runHogQL({ projectId: opts.projectIds[0], query: opts.query });
  const parts = await Promise.all(opts.projectIds.map((projectId) => runHogQL({ projectId, query: opts.query })));
  const columns = parts[0]?.columns ?? [];
  // Group by all non-numeric columns; sum numeric.
  const numericIdx = new Set<number>();
  if (parts[0]?.results[0]) {
    parts[0].results[0].forEach((v, i) => {
      if (typeof v === "number") numericIdx.add(i);
    });
  }
  const grouped = new Map<string, HogQLValue[]>();
  for (const part of parts) {
    for (const row of part.results) {
      const key = row.map((v, i) => (numericIdx.has(i) ? "" : String(v))).join("\x00");
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, [...row]);
      } else {
        for (const i of numericIdx) {
          existing[i] = Number(existing[i] ?? 0) + Number(row[i] ?? 0);
        }
      }
    }
  }
  return { columns, results: Array.from(grouped.values()) };
}

export interface PosthogRecording {
  id: string;
  personName: string;
  startUrl: string;
  durationSeconds: number;
  startTime: string;
  viewerUrl: string;
}

interface RecordingsResp {
  results: Array<{
    id: string;
    person?: { name?: string; properties?: { email?: string; name?: string } };
    start_url?: string;
    recording_duration?: number;
    start_time?: string;
  }>;
}

export async function listRecordings(opts: {
  projectId: string;
  startDate: string;
  endDate: string;
  limit?: number;
}): Promise<PosthogRecording[]> {
  const { host } = creds();
  const params = new URLSearchParams({
    date_from: opts.startDate,
    date_to: opts.endDate,
    limit: String(opts.limit ?? 20),
  });
  const resp = await ph<RecordingsResp>(`/api/projects/${opts.projectId}/session_recordings/?${params}`);
  return resp.results.map((r) => ({
    id: r.id,
    personName: r.person?.properties?.email || r.person?.properties?.name || r.person?.name || "Anonymous",
    startUrl: r.start_url ?? "",
    durationSeconds: r.recording_duration ?? 0,
    startTime: r.start_time ?? "",
    viewerUrl: `${host}/project/${opts.projectId}/replay/${r.id}`,
  }));
}
