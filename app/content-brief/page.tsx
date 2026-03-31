"use client";

import { useState } from "react";
import type { ContentBriefResponse, OutlineSection } from "../api/content-brief/route";

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100 last:border-0">
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{value || <span className="text-gray-400 italic">—</span>}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      className="text-xs text-gray-400 hover:text-blue-600 transition-colors ml-2 shrink-0"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function HeadingBadge({ level }: { level: OutlineSection["level"] }) {
  const color =
    level === "H1"
      ? "bg-blue-100 text-blue-800"
      : level === "H2"
      ? "bg-violet-100 text-violet-800"
      : "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${color}`}>
      {level}
    </span>
  );
}

function WordCountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      {count.toLocaleString()} words
    </span>
  );
}

function OutlineCard({ section }: { section: OutlineSection }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <HeadingBadge level={section.level} />
        <span className="text-sm font-semibold text-gray-800 flex-1">{section.heading}</span>
        <WordCountBadge count={section.wordCount} />
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-gray-600">{section.overview}</p>

        {section.include.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Include
            </p>
            <ul className="space-y-1">
              {section.include.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.internalLinks && section.internalLinks.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Internal Links
            </p>
            <ul className="space-y-1">
              {section.internalLinks.map((link, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-300 shrink-0" />
                  {link}
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.cta && (
          <div className="flex items-center gap-2 mt-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">CTA:</span>
            <span className="text-sm text-amber-800">{section.cta}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormData {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  notes: string;
  templateUrl: string;
  existingPageUrl: string;
  targetUrl: string;
  onboardingUrl: string;
}

const emptyForm: FormData = {
  topic: "",
  primaryKeyword: "",
  secondaryKeywords: "",
  notes: "",
  templateUrl: "",
  existingPageUrl: "",
  targetUrl: "",
  onboardingUrl: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentBriefPage() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentBriefResponse | null>(null);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic.trim() || !form.primaryKeyword.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/content-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic.trim(),
          primaryKeyword: form.primaryKeyword.trim(),
          secondaryKeywords: form.secondaryKeywords.trim() || undefined,
          notes: form.notes.trim() || undefined,
          templateUrl: form.templateUrl.trim() || undefined,
          existingPageUrl: form.existingPageUrl.trim() || undefined,
          targetUrl: form.targetUrl.trim() || undefined,
          onboardingUrl: form.onboardingUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data as ContentBriefResponse);
      }
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const totalOutlineWords = result?.outline.reduce((s, sec) => s + sec.wordCount, 0) ?? 0;
  const wordCountMatch = result && totalOutlineWords === result.brief.targetWordCount;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Content Brief Generator</h1>
          <p className="mt-2 text-gray-500">
            Enter your topic and keyword — competitors are auto-researched and the brief is built here.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-5 space-y-4">
            {/* Required */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Topic <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={set("topic")}
                  placeholder="e.g. Puppy Training Programs"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Primary Keyword <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.primaryKeyword}
                  onChange={set("primaryKeyword")}
                  placeholder="e.g. puppy training New York"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            {/* Optional toggle */}
            <button
              type="button"
              onClick={() => setShowOptional((v) => !v)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <span>{showOptional ? "▾" : "▸"}</span>
              {showOptional ? "Hide" : "Show"} additional inputs
            </button>

            {showOptional && (
              <div className="space-y-4 pt-1 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Secondary Keywords
                  </label>
                  <input
                    type="text"
                    value={form.secondaryKeywords}
                    onChange={set("secondaryKeywords")}
                    placeholder="Comma-separated: puppy obedience, dog training camps"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Notes / Client Preferences
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={set("notes")}
                    rows={3}
                    placeholder="Any client-specific preferences, things to include, tone notes…"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Template Page URL
                    </label>
                    <input
                      type="url"
                      value={form.templateUrl}
                      onChange={set("templateUrl")}
                      placeholder="https://… (page or Google Doc)"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Crawled for page structure &amp; modules</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Existing Page URL
                    </label>
                    <input
                      type="url"
                      value={form.existingPageUrl}
                      onChange={set("existingPageUrl")}
                      placeholder="https://… (page or Google Doc)"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Crawled to inform rewrite or update</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Target URL
                    </label>
                    <input
                      type="url"
                      value={form.targetUrl}
                      onChange={set("targetUrl")}
                      placeholder="https://… (final destination)"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Informational — for redirect planning</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Client Onboarding Doc URL
                    </label>
                    <input
                      type="url"
                      value={form.onboardingUrl}
                      onChange={set("onboardingUrl")}
                      placeholder="https://docs.google.com/… or any URL"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Crawled for brand voice &amp; service info</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Competitors are auto-discovered via web search
            </p>
            <button
              type="submit"
              disabled={loading || !form.topic.trim() || !form.primaryKeyword.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Generating…" : "Generate Brief"}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-6 text-center text-sm text-gray-400 animate-pulse">
            Searching competitors, crawling pages, and generating brief…
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-5">

            {/* Brief Summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader>Brief</SectionHeader>
              <div className="divide-y divide-gray-100">
                <Field label="Topic" value={result.brief.topic} />
                <Field label="Primary Keyword" value={result.brief.primaryKeyword} />
                {result.brief.secondaryKeywords.length > 0 && (
                  <Field label="Secondary Keywords" value={result.brief.secondaryKeywords.join(", ")} />
                )}
                <Field label="Target Word Count" value={`${result.brief.targetWordCount.toLocaleString()} words`} />
                <Field label="Target Audience" value={result.brief.targetAudience} />
                <Field label="Readability" value={result.brief.readabilityLevel} />
                <Field label="Content Angle" value={result.brief.contentAngle} />
                <Field label="Call to Action" value={result.brief.callToAction} />
                <div className="px-5 py-3">
                  <p className="text-xs font-medium text-gray-400 mb-2">Key Info / Always Include</p>
                  <ul className="space-y-1.5">
                    {result.brief.keyInfo.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Outline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Outline — {result.outline.length} sections
                </h2>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    wordCountMatch
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {totalOutlineWords.toLocaleString()} / {result.brief.targetWordCount.toLocaleString()} words
                  {wordCountMatch ? " ✓" : ""}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {result.outline.map((section, i) => (
                  <OutlineCard key={i} section={section} />
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader>Metadata</SectionHeader>
              <div className="divide-y divide-gray-100">
                <div className="px-5 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-medium text-gray-400">Meta Title</p>
                    <CopyButton text={result.metadata.metaTitle} />
                  </div>
                  <p className="text-sm text-gray-800">{result.metadata.metaTitle}</p>
                  <p className="text-xs text-gray-400 mt-1">{result.metadata.metaTitle.length} chars</p>
                </div>
                <div className="px-5 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-medium text-gray-400">Meta Description</p>
                    <CopyButton text={result.metadata.metaDescription} />
                  </div>
                  <p className="text-sm text-gray-800">{result.metadata.metaDescription}</p>
                  <p className="text-xs text-gray-400 mt-1">{result.metadata.metaDescription.length} chars</p>
                </div>
              </div>
            </div>

            {/* Competitors found */}
            {result.competitorUrls.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader>Competitors Analyzed</SectionHeader>
                <ul className="divide-y divide-gray-100">
                  {result.competitorUrls.map((url, i) => (
                    <li key={i} className="px-5 py-2.5">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
