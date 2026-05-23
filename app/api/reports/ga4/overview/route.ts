import { NextRequest, NextResponse } from "next/server";
import { runReport } from "@/lib/ga4";

export interface Ga4OverviewPoint {
  date: string;
  sessions: number;
  activeUsers: number;
  newUsers: number;
}

export interface Ga4OverviewResponse {
  series: Ga4OverviewPoint[];
  totals: {
    sessions: number;
    activeUsers: number;
    newUsers: number;
    bounceRate: number;
    averageSessionDuration: number;
    screenPageViewsPerSession: number;
    newUserPercent: number;
  };
}

function formatGa4Date(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export async function GET(req: NextRequest) {
  const propertyId = req.nextUrl.searchParams.get("propertyId");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  if (!propertyId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required params: propertyId, startDate, endDate" },
      { status: 400 }
    );
  }

  try {
    const [series, totals] = await Promise.all([
      runReport({
        propertyId,
        startDate,
        endDate,
        dimensions: ["date"],
        metrics: ["sessions", "activeUsers", "newUsers"],
        limit: 400,
      }),
      runReport({
        propertyId,
        startDate,
        endDate,
        dimensions: [],
        metrics: [
          "sessions",
          "activeUsers",
          "newUsers",
          "bounceRate",
          "averageSessionDuration",
          "screenPageViewsPerSession",
        ],
      }),
    ]);

    const points: Ga4OverviewPoint[] = series.rows
      .map((r) => ({
        date: formatGa4Date(r.dimensionValues[0] ?? ""),
        sessions: Number(r.metricValues[0] ?? 0),
        activeUsers: Number(r.metricValues[1] ?? 0),
        newUsers: Number(r.metricValues[2] ?? 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const t = totals.totals;
    const activeUsers = Number(t[1] ?? 0);
    const newUsers = Number(t[2] ?? 0);

    const body: Ga4OverviewResponse = {
      series: points,
      totals: {
        sessions: Number(t[0] ?? 0),
        activeUsers,
        newUsers,
        bounceRate: Number(t[3] ?? 0),
        averageSessionDuration: Number(t[4] ?? 0),
        screenPageViewsPerSession: Number(t[5] ?? 0),
        newUserPercent: activeUsers > 0 ? newUsers / activeUsers : 0,
      },
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
