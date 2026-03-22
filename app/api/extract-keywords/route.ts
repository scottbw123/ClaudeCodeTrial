import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export interface Keyword {
  keyword: string;
  relevance: number; // 0–100
  rationale: string;
}

export interface ExtractResponse {
  keywords: Keyword[];
  pageTitle: string;
}

async function fetchPageText(url: string): Promise<{ title: string; text: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; KeywordBot/1.0)" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, header, noscript, iframe, [aria-hidden='true']").remove();

  const title = $("title").first().text().trim() || $("h1").first().text().trim() || url;

  // Gather meaningful text
  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000); // cap to avoid overly large prompts

  return { title, text };
}

export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Ensure it's a valid URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let title: string;
  let text: string;
  try {
    ({ title, text } = await fetchPageText(url));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Could not fetch page: ${message}` }, { status: 422 });
  }

  if (!text || text.length < 50) {
    return NextResponse.json({ error: "Page has insufficient text content" }, { status: 422 });
  }

  const systemPrompt = `You are an expert SEO strategist. Given the text content of a web page, identify the most valuable seed keywords for an SEO campaign targeting that page's topic.

Return ONLY valid JSON in this exact shape:
{
  "keywords": [
    {
      "keyword": "<1–4 word phrase>",
      "relevance": <integer 1–100>,
      "rationale": "<one sentence explaining why this keyword matters>"
    }
  ]
}

Rules:
- Return 8–12 keywords
- Prefer specific, high-intent phrases over vague single words
- relevance 90–100: core topic, extremely high intent
- relevance 70–89: closely related, strong intent
- relevance 50–69: supporting topic, moderate intent
- relevance below 50: broader or tangential
- Sort by relevance descending
- Do not include the URL itself as a keyword`;

  const userMessage = `Page title: ${title}\n\nPage content:\n${text}`;

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const message = await stream.finalMessage();

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from model");
    }

    // Strip markdown code fences if present
    const raw = textBlock.text.replace(/```(?:json)?\n?/g, "").trim();
    const parsed: ExtractResponse = { ...JSON.parse(raw), pageTitle: title };

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Analysis failed: ${message}` }, { status: 500 });
  }
}
