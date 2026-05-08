import * as cheerio from "cheerio";

export interface ScrapedPage {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  headings: { level: 2 | 3; text: string }[];
  wordCount: number;
  text: string;
  /** First ~6000 chars of cleaned body text. */
  excerpt: string;
}

/**
 * Fetch a URL and extract SEO-relevant structure.
 * Returns null on failure (timeout, blocked, non-OK response, etc.).
 */
export async function scrapePage(url: string, timeoutMs = 12_000): Promise<ScrapedPage | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GSC-Gap-Analyzer/1.0; +https://example.com/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });

    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const title = ($("title").first().text() || "").trim();
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      "";
    const h1 = $("h1").first().text().trim();

    const headings: ScrapedPage["headings"] = [];
    $("h2, h3").each((_, el) => {
      const text = $(el).text().trim();
      if (!text) return;
      headings.push({ level: el.tagName.toLowerCase() === "h2" ? 2 : 3, text });
    });

    $("script, style, nav, footer, header, noscript, iframe, [aria-hidden='true']").remove();
    const fullText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    const excerpt = fullText.slice(0, 6000);

    return {
      url,
      title,
      metaDescription,
      h1,
      headings: headings.slice(0, 60),
      wordCount,
      text: fullText,
      excerpt,
    };
  } catch {
    return null;
  }
}

export async function scrapeMany(urls: string[], concurrency = 4): Promise<ScrapedPage[]> {
  const queue = [...urls];
  const out: ScrapedPage[] = [];
  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(
      (async () => {
        while (queue.length) {
          const url = queue.shift();
          if (!url) return;
          const page = await scrapePage(url);
          if (page) out.push(page);
        }
      })(),
    );
  }
  await Promise.all(workers);
  return out;
}
