import { NextResponse } from "next/server";
import { listSites, type GscSite } from "@/lib/gsc";
import { listProperties, type Ga4Property } from "@/lib/ga4";

export interface PropertiesResponse {
  gscSites: GscSite[];
  ga4Properties: Ga4Property[];
}

export async function GET() {
  try {
    const [gscSites, ga4Properties] = await Promise.all([listSites(), listProperties()]);
    const body: PropertiesResponse = { gscSites, ga4Properties };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
