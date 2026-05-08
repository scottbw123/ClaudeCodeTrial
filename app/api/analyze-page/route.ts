import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { competitorsAbove, fetchSerp, type SerpItem } from "@/lib/dataforseo";
import { scrapeMany, scrapePage, type ScrapedPage } from "@/lib/scrape";
import { getSession } from "@/lib/session";

const anthropic = new Anthropic();
const MODEL = "claude-sonnet-4-6";

interface AnalyzeRequest {
  pageUrl: string;
  keyword: string;
  locationCode?: number;
  languageCode?: string;
  device?: "desktop" | "mobile";
}

export interface GapFinding {
  category: "topical" | "structural" | "intent" | "metadata" | "depth" | "freshness" | "eeat";
  severity: "high" | "medium" | "low";
  finding: string;
  recommendation: string;
}

export interface AnalyzeResponse {
  keyword: string;
  pageUrl: string;
  userRank: number | null;
  serp: SerpItem[];
  competitorsAnalyzed: { url: string; rank: number; title: string }[];
  userPage: { title: string; metaDescription: string; h1: string; wordCount: number; headingCount: number } | null;
  summary: string;
  gaps: GapFinding[];
  quickWins: string[];
}

const SYSTEM_PROMPT = `You are a senior SEO strategist specializing in on-page and content gap analysis.
You will be given:
1. A target keyword and the user's page (URL, title, meta, headings, word count, content excerpt).
2. The current top-ranking pages for that keyword (the competitors who outrank the user).

Identify why the user's page is likely losing to these competitors and what concrete gaps exist.

Apply these SEO best practices when reasoning:
- Search intent alignment (informational vs. transactional vs. navigational vs. commercial investigation)
- Topical depth & coverage of subtopics / entities competitors cover
- Content structure (headings hierarchy, scannability, table of contents, FAQ schema)
- Format match (listicle vs. guide vs. comparison vs. tool vs. video)
- Title tag and meta description optimization (relevance, CTR, primary keyword placement)
- Content freshness and recency signals
- E-E-A-T signals (author, expertise indicators, citations, original data)
- Internal linking opportunities and supporting content
- Word count appropriate to query intent (not just longer = better)
- Featured snippet / PAA optimization where relevant

Return ONLY valid JSON in this exact shape:
{
  "summary": "<2-4 sentence executive summary explaining the most likely reason the user is being outranked>",
  "gaps": [
    {
      "category": "topical" | "structural" | "intent" | "metadata" | "depth" | "freshness" | "eeat",
      "severity": "high" | "medium" | "low",
      "finding": "<specific observation citing what competitors do that the user does not>",
      "recommendation": "<concrete action the user should take>"
    }
  ],
  "quickWins": ["<short, high-leverage action 1>", "<action 2>", "..."]
}

Rules:
- Return 4-8 gaps total, ordered by severity (high first).
- Each finding must reference observable evidence (e.g., "all 3 competitors include an H2 on 'pricing comparison'; user's page does not").
- Recommendations must be specific and actionable, not generic advice.
- Quick wins are 3-6 items that could be shipped in under an hour each.
- Do not invent data; if a claim isn't supported by the supplied content, do not make it.`;

function summarizePageForPrompt(page: ScrapedPage, label: string, rank?: number): string {
  const headings = page.headings
    .slice(0, 25)
    .map((h) => `${"  ".repeat(h.level - 2)}H${h.level}: ${h.text}`)
    .join("\n");
  return [
    `=== ${label}${rank ? ` (rank #${rank})` : ""} ===`,
    `URL: ${page.url}`,
    `Title: ${page.title}`,
    `Meta description: ${page.metaDescription || "(none)"}`,
    `H1: ${page.h1 || "(none)"}`,
    `Word count: ${page.wordCount}`,
    `Headings:\n${headings || "(none)"}`,
    `Content excerpt:\n${page.excerpt.slice(0, 4000)}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.pageUrl || !body.keyword) {
    return NextResponse.json({ error: "pageUrl and keyword required" }, { status: 400 });
  }
  try {
    new URL(body.pageUrl);
  } catch {
    return NextResponse.json({ error: "Invalid pageUrl" }, { status: 400 });
  }

  let serp: SerpItem[];
  try {
    serp = await fetchSerp({
      keyword: body.keyword,
      locationCode: body.locationCode,
      languageCode: body.languageCode,
      device: body.device,
      depth: 10,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `SERP lookup failed: ${message}` }, { status: 502 });
  }

  const { userRank, competitors } = competitorsAbove(serp, body.pageUrl);

  if (competitors.length === 0) {
    return NextResponse.json<AnalyzeResponse>({
      keyword: body.keyword,
      pageUrl: body.pageUrl,
      userRank,
      serp,
      competitorsAnalyzed: [],
      userPage: null,
      summary:
        userRank === 1
          ? "Your page is already #1 for this keyword. No competitors above to analyze."
          : "No competitors found above your page in the top 10. Try widening the SERP depth or check the keyword.",
      gaps: [],
      quickWins: [],
    });
  }

  // Cap analysis to top 5 competitors above to keep latency / token usage bounded.
  const competitorsToScrape = competitors.slice(0, 5);

  const [userScraped, competitorPages] = await Promise.all([
    scrapePage(body.pageUrl),
    scrapeMany(competitorsToScrape.map((c) => c.url), 4),
  ]);

  if (!userScraped) {
    return NextResponse.json({ error: "Could not fetch your page" }, { status: 422 });
  }
  if (competitorPages.length === 0) {
    return NextResponse.json(
      { error: "Could not fetch any competitor pages (they may block scraping)" },
      { status: 422 },
    );
  }

  // Pair scraped pages back to their SERP rank
  const rankByUrl = new Map(competitorsToScrape.map((c) => [c.url, c.rank]));
  const competitorsForPrompt = competitorPages
    .map((p) => ({ page: p, rank: rankByUrl.get(p.url) ?? 0 }))
    .sort((a, b) => a.rank - b.rank);

  const userBlock = summarizePageForPrompt(userScraped, "USER PAGE");
  const competitorBlocks = competitorsForPrompt
    .map((c, i) => summarizePageForPrompt(c.page, `COMPETITOR ${i + 1}`, c.rank))
    .join("\n\n");

  const userMessage = [
    `Target keyword: ${body.keyword}`,
    `User's current SERP rank: ${userRank ?? "not in top 10"}`,
    "",
    userBlock,
    "",
    competitorBlocks,
  ].join("\n");

  let parsed: { summary: string; gaps: GapFinding[]; quickWins: string[] };
  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const message = await stream.finalMessage();
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from model");
    }
    const raw = textBlock.text.replace(/```(?:json)?\n?/g, "").trim();
    parsed = JSON.parse(raw);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Gap analysis failed: ${message}` }, { status: 500 });
  }

  const response: AnalyzeResponse = {
    keyword: body.keyword,
    pageUrl: body.pageUrl,
    userRank,
    serp,
    competitorsAnalyzed: competitorsForPrompt.map((c) => ({
      url: c.page.url,
      rank: c.rank,
      title: c.page.title,
    })),
    userPage: {
      title: userScraped.title,
      metaDescription: userScraped.metaDescription,
      h1: userScraped.h1,
      wordCount: userScraped.wordCount,
      headingCount: userScraped.headings.length,
    },
    summary: parsed.summary,
    gaps: parsed.gaps,
    quickWins: parsed.quickWins,
  };

  return NextResponse.json(response);
}
