import { NextRequest, NextResponse } from "next/server";
import { queryGsc } from "@/lib/gsc";

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueriesResponse {
  rows: GscQueryRow[];
  totals: { clicks: number; impressions: number; ctr: number; position: number };
}

export async function GET(req: NextRequest) {
  const siteUrl = req.nextUrl.searchParams.get("siteUrl");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  if (!siteUrl || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required params: siteUrl, startDate, endDate" },
      { status: 400 }
    );
  }

  try {
    const raw = await queryGsc({
      siteUrl,
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 250,
    });

    const rows: GscQueryRow[] = raw.map((r) => ({
      query: r.keys[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));

    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const position =
      rows.length > 0
        ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / Math.max(impressions, 1)
        : 0;

    const body: GscQueriesResponse = {
      rows,
      totals: { clicks, impressions, ctr, position },
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
