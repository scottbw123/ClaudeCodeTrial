import { NextResponse } from "next/server";
import { getBotUser } from "@/lib/notion/client";
import { notionConfig } from "@/lib/notion/config";

/**
 * Setup/diagnostics endpoint: confirms the integration token works and reports
 * which data sources are configured. Useful right after provisioning the token.
 */
export async function GET() {
  if (!notionConfig.token) {
    return NextResponse.json(
      { ok: false, error: "NOTION_TOKEN not set." },
      { status: 503 },
    );
  }

  try {
    const bot = await getBotUser();
    return NextResponse.json({
      ok: true,
      bot: { id: bot.id, name: bot.name ?? null },
      version: notionConfig.version,
      dataSources: notionConfig.dataSources,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Notion request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
