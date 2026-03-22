"use client";

import { useState } from "react";
import type { ExtractResponse, Keyword } from "./api/extract-keywords/route";

function RelevanceBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-emerald-100 text-emerald-800"
      : score >= 70
      ? "bg-blue-100 text-blue-800"
      : score >= 50
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-600";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}

function RelevanceBar({ score }: { score: number }) {
  const width = `${score}%`;
  const color =
    score >= 90
      ? "bg-emerald-500"
      : score >= 70
      ? "bg-blue-500"
      : score >= 50
      ? "bg-yellow-400"
      : "bg-gray-400";

  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width }} />
    </div>
  );
}

function KeywordRow({ keyword }: { keyword: Keyword }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-gray-900">{keyword.keyword}</span>
        <RelevanceBadge score={keyword.relevance} />
      </div>
      <RelevanceBar score={keyword.relevance} />
      <p className="text-sm text-gray-500 mt-0.5">{keyword.rationale}</p>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data as ExtractResponse);
      }
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Seed Keyword Extractor</h1>
          <p className="mt-2 text-gray-500">
            Enter a URL to discover the best seed keywords for your SEO strategy.
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            required
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-8 text-center text-sm text-gray-400 animate-pulse">
            Fetching page and analyzing content…
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 flex flex-col gap-4">
            {/* Page details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Page Details</p>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="px-5 py-3">
                  <p className="text-xs font-medium text-gray-400 mb-0.5">Meta Title</p>
                  <p className="text-sm text-gray-800">{result.metaTitle || <span className="text-gray-400 italic">Not found</span>}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs font-medium text-gray-400 mb-0.5">Meta Description</p>
                  <p className="text-sm text-gray-800">{result.metaDescription || <span className="text-gray-400 italic">Not found</span>}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs font-medium text-gray-400 mb-0.5">H1</p>
                  <p className="text-sm text-gray-800">{result.h1 || <span className="text-gray-400 italic">Not found</span>}</p>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top Keywords</p>
              </div>
              <div className="px-5">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Keyword</span>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Relevance</span>
                </div>
                {result.keywords.map((kw) => (
                  <KeywordRow key={kw.keyword} keyword={kw} />
                ))}
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Scores are 1–100 (higher = more relevant)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
