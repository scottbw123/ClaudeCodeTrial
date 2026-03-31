import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OutlineSection {
  heading: string;
  level: "H1" | "H2" | "H3";
  overview: string;
  wordCount: number;
  include: string[];
  internalLinks?: string[];
  cta?: string;
}

export interface ContentBriefResponse {
  brief: {
    topic: string;
    primaryKeyword: string;
    secondaryKeywords: string[];
    targetWordCount: number;
    targetAudience: string;
    readabilityLevel: string;
    contentAngle: string;
    callToAction: string;
    keyInfo: string[];
  };
  outline: OutlineSection[];
  metadata: {
    metaTitle: string;
    metaDescription: string;
  };
  competitorUrls: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Rewrites Google Docs share URLs to plain-text export URLs. */
function normalizeUrl(url: string): string {
  const gdocsMatch = url.match(/docs\.google\.com\/document\/d\/([^/?#]+)/);
  if (gdocsMatch) {
    return `https://docs.google.com/document/d/${gdocsMatch[1]}/export?format=txt`;
  }
  return url;
}

/** Fetches a page (or Google Doc) and returns its title, cleaned text, and word count. */
async function fetchPageText(url: string): Promise<{
  title: string;
  text: string;
  wordCount: number;
}> {
  const normalized = normalizeUrl(url);
  const res = await fetch(normalized, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ContentBriefBot/1.0)",
      Accept: "text/html,text/plain",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("text/plain")) {
    const text = (await res.text()).replace(/\s+/g, " ").trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return { title: url, text: text.slice(0, 10_000), wordCount };
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    url;

  $("script, style, nav, footer, header, noscript, iframe, [aria-hidden='true']").remove();

  const text = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { title, text: text.slice(0, 10_000), wordCount };
}

/** Searches DuckDuckGo HTML and returns up to 5 organic competitor URLs. */
async function searchCompetitors(keyword: string): Promise<string[]> {
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ContentBriefBot/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!res.ok) return [];

  const html = await res.text();
  const $ = cheerio.load(html);

  const skipDomains = [
    "yelp.com",
    "facebook.com",
    "youtube.com",
    "wikipedia.org",
    "reddit.com",
    "amazon.com",
    "twitter.com",
    "instagram.com",
    "linkedin.com",
    "pinterest.com",
    "tiktok.com",
    "google.com",
    "duckduckgo.com",
  ];

  const urls: string[] = [];

  $("a.result__a").each((_, el) => {
    if (urls.length >= 5) return;
    const href = $(el).attr("href") ?? "";

    // DuckDuckGo wraps results in redirect links: /l/?uddg=<encoded_url>
    let url = href;
    const match = href.match(/[?&]uddg=([^&]+)/);
    if (match) {
      try {
        url = decodeURIComponent(match[1]);
      } catch {
        return;
      }
    }

    try {
      const { hostname } = new URL(url);
      const domain = hostname.replace(/^www\./, "");
      if (skipDomains.some((skip) => domain.includes(skip))) return;
      if (!urls.includes(url)) urls.push(url);
    } catch {
      // invalid URL
    }
  });

  return urls;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const topic = body.topic as string | undefined;
  const primaryKeyword = body.primaryKeyword as string | undefined;
  const secondaryKeywords = body.secondaryKeywords as string | undefined;
  const notes = body.notes as string | undefined;
  const templateUrl = body.templateUrl as string | undefined;
  const existingPageUrl = body.existingPageUrl as string | undefined;
  const targetUrl = body.targetUrl as string | undefined;
  const onboardingUrl = body.onboardingUrl as string | undefined;

  if (!topic?.trim()) {
    return NextResponse.json({ error: "Missing topic" }, { status: 400 });
  }
  if (!primaryKeyword?.trim()) {
    return NextResponse.json({ error: "Missing primaryKeyword" }, { status: 400 });
  }

  // ── Fetch all context concurrently ──────────────────────────────────────────
  const [competitorUrls, templateResult, existingPageResult, onboardingResult] =
    await Promise.all([
      searchCompetitors(primaryKeyword).catch(() => [] as string[]),
      templateUrl ? fetchPageText(templateUrl).catch(() => null) : null,
      existingPageUrl ? fetchPageText(existingPageUrl).catch(() => null) : null,
      onboardingUrl ? fetchPageText(onboardingUrl).catch(() => null) : null,
    ]);

  // ── Crawl competitors ───────────────────────────────────────────────────────
  const competitorSettled = await Promise.allSettled(
    competitorUrls.map((url) => fetchPageText(url))
  );
  const competitors = competitorSettled
    .filter(
      (
        r
      ): r is PromiseFulfilledResult<{
        title: string;
        text: string;
        wordCount: number;
      }> => r.status === "fulfilled"
    )
    .map((r) => r.value);

  const avgWordCount =
    competitors.length > 0
      ? Math.round(
          competitors.reduce((s, c) => s + c.wordCount, 0) / competitors.length
        )
      : 1200;

  // ── Build user message ──────────────────────────────────────────────────────
  const lines: string[] = [
    `Topic: ${topic}`,
    `Primary Keyword: ${primaryKeyword}`,
  ];
  if (secondaryKeywords?.trim()) lines.push(`Secondary Keywords: ${secondaryKeywords}`);
  if (targetUrl?.trim()) lines.push(`Target URL: ${targetUrl}`);
  if (notes?.trim()) lines.push(`\nNotes / Client Preferences:\n${notes}`);
  if (onboardingResult) {
    lines.push(`\n--- CLIENT ONBOARDING INFO ---\n${onboardingResult.text}`);
  }
  if (templateResult) {
    lines.push(`\n--- PAGE TEMPLATE STRUCTURE ---\n${templateResult.text}`);
  }
  if (existingPageResult) {
    lines.push(`\n--- EXISTING PAGE CONTENT ---\n${existingPageResult.text}`);
  }
  if (competitors.length > 0) {
    lines.push(
      `\n--- COMPETITOR ANALYSIS (${competitors.length} pages, avg ${avgWordCount} words) ---`
    );
    competitors.forEach((c, i) => {
      lines.push(
        `\nCompetitor ${i + 1}: ${c.title} (~${c.wordCount} words)\n${c.text.slice(0, 2000)}`
      );
    });
  }
  lines.push(`\nTarget Word Count (based on competitor average): ${avgWordCount}`);

  const userMessage = lines.join("\n");

  const systemPrompt = `You are a senior content strategist producing high-value SEO content briefs. Your work is distinguished by going BEYOND reverse-engineering competitors — you identify competitor patterns, then recommend how to surpass them using the client's unique brand, voice, and service differentiators.

Return ONLY valid JSON in this exact shape — no markdown fences, no prose:
{
  "brief": {
    "topic": "<topic>",
    "primaryKeyword": "<primary keyword>",
    "secondaryKeywords": ["<kw1>", "<kw2>"],
    "targetWordCount": <integer matching competitor average>,
    "targetAudience": "<specific, detailed audience description>",
    "readabilityLevel": "<Hemingway assessment, e.g. Grade 7–8 (conversational)>",
    "contentAngle": "<strategic angle — explain WHAT to write and WHY it goes beyond competitors, referencing client differentiators if available>",
    "callToAction": "<primary CTA appropriate to this page type and client>",
    "keyInfo": ["<always-include item>", ...]
  },
  "outline": [
    {
      "heading": "<e.g. H1: [Full creative heading text here]>",
      "level": "H1",
      "overview": "<what this section accomplishes for the reader and for SEO>",
      "wordCount": <integer>,
      "include": ["<specific element, question, or data point to include>", ...],
      "internalLinks": ["<suggested anchor text or page description>"],
      "cta": "<optional CTA for this specific section>"
    }
  ],
  "metadata": {
    "metaTitle": "<compelling, brand-aligned, keyword-targeted meta title>",
    "metaDescription": "<engaging meta description, 150-160 chars, unique and brand-aligned — not templated>"
  }
}

Hard rules:
- Outline uses H1, H2, H3 only (writers may extend to H4 on their own)
- H1 must include the primary keyword but be CREATIVE and audience-focused — never generic
- All outline section wordCounts must sum EXACTLY to targetWordCount — verify your math before returning
- contentAngle must clearly articulate how this content will go a step beyond what competitors have done
- keyInfo should list elements competitors include AND elements that would elevate the content further
- Metadata must be genuinely engaging and brand-specific — avoid generic formulas
- If page template structure is provided, the outline must align with those modules exactly
- If existing page content is provided, note what to preserve, update, or replace
- If client onboarding info is provided, reflect their brand voice, terminology, and service framing throughout`;

  // ── Call Claude ─────────────────────────────────────────────────────────────
  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const message = await stream.finalMessage();

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from model");
    }

    const raw = textBlock.text.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(raw) as Omit<ContentBriefResponse, "competitorUrls">;

    return NextResponse.json({ ...parsed, competitorUrls });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Brief generation failed: ${msg}` },
      { status: 500 }
    );
  }
}
