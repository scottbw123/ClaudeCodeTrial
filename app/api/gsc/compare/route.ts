import { NextRequest, NextResponse } from "next/server";
import {
  attachTopQueries,
  buildComparisons,
  rankDecliningPages,
  rowsToPageMetrics,
  searchAnalytics,
  type PageComparison,
} from "@/lib/gsc";
import { getSession } from "@/lib/session";

interface CompareRequest {
  siteUrl: string;
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  positionDeltaMin?: number;
  minPreviousImpressions?: number;
  maxRows?: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validate(body: Partial<CompareRequest>): string | null {
  if (!body.siteUrl) return "siteUrl required";
  for (const key of ["currentStart", "currentEnd", "previousStart", "previousEnd"] as const) {
    const v = body[key];
    if (!v || !DATE_RE.test(v)) return `${key} must be YYYY-MM-DD`;
  }
  if (body.currentStart! > body.currentEnd!) return "currentStart must be <= currentEnd";
  if (body.previousStart! > body.previousEnd!) return "previousStart must be <= previousEnd";
  return null;
}

export interface CompareResponse {
  total: number;
  declining: PageComparison[];
  current: { startDate: string; endDate: string };
  previous: { startDate: string; endDate: string };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: CompareRequest;
  try {
    body = (await req.json()) as CompareRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const [currentRows, previousRows] = await Promise.all([
      searchAnalytics({
        siteUrl: body.siteUrl,
        startDate: body.currentStart,
        endDate: body.currentEnd,
        dimensions: ["page"],
      }),
      searchAnalytics({
        siteUrl: body.siteUrl,
        startDate: body.previousStart,
        endDate: body.previousEnd,
        dimensions: ["page"],
      }),
    ]);

    const currentByPage = rowsToPageMetrics(currentRows);
    const previousByPage = rowsToPageMetrics(previousRows);

    const comparisons = buildComparisons(currentByPage, previousByPage);
    const declining = rankDecliningPages(comparisons, {
      positionDeltaMin: body.positionDeltaMin,
      minPreviousImpressions: body.minPreviousImpressions,
    });

    const maxRows = body.maxRows ?? 100;
    const top = declining.slice(0, maxRows);

    // Enrich with top query per page (for the current period)
    await attachTopQueries(body.siteUrl, body.currentStart, body.currentEnd, top, 4);

    const response: CompareResponse = {
      total: declining.length,
      declining: top,
      current: { startDate: body.currentStart, endDate: body.currentEnd },
      previous: { startDate: body.previousStart, endDate: body.previousEnd },
    };
    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
