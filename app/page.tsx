"use client";

import { useEffect, useState } from "react";
import type { CompareResponse } from "./api/gsc/compare/route";
import type { AnalyzeResponse, GapFinding } from "./api/analyze-page/route";
import type { PageComparison } from "@/lib/gsc";

interface MeResponse {
  authenticated: boolean;
  email: string | null;
}

interface SitesResponse {
  sites?: { siteUrl: string; permissionLevel: string }[];
  error?: string;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultDates() {
  // GSC has a ~2-3 day data lag. End "yesterday".
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(end.getDate() - 27);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - 27);

  return {
    currentStart: formatDate(start),
    currentEnd: formatDate(end),
    previousStart: formatDate(prevStart),
    previousEnd: formatDate(prevEnd),
  };
}

function fmtPos(p: number): string {
  return p.toFixed(1);
}

function severityClasses(sev: GapFinding["severity"]) {
  switch (sev) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "low":
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

function categoryLabel(cat: GapFinding["category"]): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function Home() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [sites, setSites] = useState<{ siteUrl: string }[]>([]);
  const [siteUrl, setSiteUrl] = useState("");
  const [dates, setDates] = useState(defaultDates());
  const [positionDeltaMin, setPositionDeltaMin] = useState(1);
  const [minPreviousImpressions, setMinPreviousImpressions] = useState(10);

  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);

  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, AnalyzeResponse>>({});
  const [analyzeErrors, setAnalyzeErrors] = useState<Record<string, string>>({});
  const [openPage, setOpenPage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: MeResponse) => setMe(d))
      .catch(() => setMe({ authenticated: false, email: null }));
  }, []);

  useEffect(() => {
    if (!me?.authenticated) return;
    fetch("/api/gsc/sites")
      .then((r) => r.json())
      .then((d: SitesResponse) => {
        if (d.sites) {
          setSites(d.sites);
          if (d.sites[0]) setSiteUrl(d.sites[0].siteUrl);
        }
      });
  }, [me?.authenticated]);

  async function runCompare() {
    if (!siteUrl) return;
    setCompareLoading(true);
    setCompareError(null);
    setCompareResult(null);
    setAnalyses({});
    setAnalyzeErrors({});
    setOpenPage(null);
    try {
      const res = await fetch("/api/gsc/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl,
          currentStart: dates.currentStart,
          currentEnd: dates.currentEnd,
          previousStart: dates.previousStart,
          previousEnd: dates.previousEnd,
          positionDeltaMin,
          minPreviousImpressions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompareError(data.error ?? "Comparison failed");
      } else {
        setCompareResult(data as CompareResponse);
      }
    } catch (e) {
      setCompareError(e instanceof Error ? e.message : String(e));
    } finally {
      setCompareLoading(false);
    }
  }

  async function analyzePage(p: PageComparison) {
    if (!p.topQuery) {
      setAnalyzeErrors((prev) => ({ ...prev, [p.page]: "No top query available for this page." }));
      return;
    }
    setAnalyzing(p.page);
    setAnalyzeErrors((prev) => {
      const next = { ...prev };
      delete next[p.page];
      return next;
    });
    setOpenPage(p.page);
    try {
      const res = await fetch("/api/analyze-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageUrl: p.page,
          keyword: p.topQuery,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeErrors((prev) => ({ ...prev, [p.page]: data.error ?? "Analysis failed" }));
      } else {
        setAnalyses((prev) => ({ ...prev, [p.page]: data as AnalyzeResponse }));
      }
    } catch (e) {
      setAnalyzeErrors((prev) => ({ ...prev, [p.page]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setAnalyzing(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe({ authenticated: false, email: null });
    setSites([]);
    setSiteUrl("");
    setCompareResult(null);
  }

  if (me === null) {
    return (
      <main className="min-h-screen bg-gray-50 grid place-items-center text-gray-400 text-sm">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              GSC Ranking Drop Analyzer
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Compare Search Console periods, find pages losing rank, and identify content gaps vs.
              competitors.
            </p>
          </div>
          {me.authenticated ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">{me.email}</span>
              <button
                onClick={logout}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </header>

        {!me.authenticated ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Search Console</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Sign in with the Google account that has access to your verified GSC properties.
              We only request read access to Search Console data.
            </p>
            <a
              href="/api/auth/google"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Sign in with Google
            </a>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Property
                  </label>
                  <select
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                  >
                    {sites.length === 0 ? (
                      <option value="">No properties found</option>
                    ) : (
                      sites.map((s) => (
                        <option key={s.siteUrl} value={s.siteUrl}>
                          {s.siteUrl}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Min position drop
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={positionDeltaMin}
                      onChange={(e) => setPositionDeltaMin(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Min prior impressions
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={minPreviousImpressions}
                      onChange={(e) => setMinPreviousImpressions(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <DateField
                  label="Current start"
                  value={dates.currentStart}
                  onChange={(v) => setDates({ ...dates, currentStart: v })}
                />
                <DateField
                  label="Current end"
                  value={dates.currentEnd}
                  onChange={(v) => setDates({ ...dates, currentEnd: v })}
                />
                <DateField
                  label="Previous start"
                  value={dates.previousStart}
                  onChange={(v) => setDates({ ...dates, previousStart: v })}
                />
                <DateField
                  label="Previous end"
                  value={dates.previousEnd}
                  onChange={(v) => setDates({ ...dates, previousEnd: v })}
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Default: last 28 days vs the prior 28 days. GSC has ~2-3 day data lag.
                </p>
                <button
                  onClick={runCompare}
                  disabled={compareLoading || !siteUrl}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {compareLoading ? "Comparing…" : "Find ranking drops"}
                </button>
              </div>
            </div>

            {compareError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
                {compareError}
              </div>
            )}

            {compareLoading && (
              <div className="text-center text-sm text-gray-400 animate-pulse py-12">
                Pulling Search Console data and computing deltas…
              </div>
            )}

            {compareResult && (
              <>
                <div className="text-sm text-gray-500 mb-3">
                  {compareResult.declining.length} of {compareResult.total} declining pages shown
                  &middot; current {compareResult.current.startDate} → {compareResult.current.endDate}
                  &middot; previous {compareResult.previous.startDate} → {compareResult.previous.endDate}
                </div>

                {compareResult.declining.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-500">
                    No pages match your decline thresholds. Try lowering the minimum position drop.
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-4 py-3 text-left">Page</th>
                            <th className="px-4 py-3 text-left">Top query</th>
                            <th className="px-4 py-3 text-right">Prev pos</th>
                            <th className="px-4 py-3 text-right">Curr pos</th>
                            <th className="px-4 py-3 text-right">Δ</th>
                            <th className="px-4 py-3 text-right">Prev impr</th>
                            <th className="px-4 py-3 text-right">Δ clicks</th>
                            <th className="px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {compareResult.declining.map((row) => {
                            const isOpen = openPage === row.page;
                            const analysis = analyses[row.page];
                            const error = analyzeErrors[row.page];
                            const isAnalyzing = analyzing === row.page;
                            return (
                              <PageRow
                                key={row.page}
                                row={row}
                                isOpen={isOpen}
                                analysis={analysis}
                                error={error}
                                isAnalyzing={isAnalyzing}
                                onToggle={() => setOpenPage(isOpen ? null : row.page)}
                                onAnalyze={() => analyzePage(row)}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function PageRow({
  row,
  isOpen,
  analysis,
  error,
  isAnalyzing,
  onToggle,
  onAnalyze,
}: {
  row: PageComparison;
  isOpen: boolean;
  analysis?: AnalyzeResponse;
  error?: string;
  isAnalyzing: boolean;
  onToggle: () => void;
  onAnalyze: () => void;
}) {
  const deltaClass =
    row.positionDelta >= 5
      ? "text-red-700 font-semibold"
      : row.positionDelta >= 2
      ? "text-orange-600 font-semibold"
      : "text-gray-700";

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 max-w-md">
          <a
            href={row.page}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline truncate block"
          >
            {row.page}
          </a>
        </td>
        <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
          {row.topQuery ?? <span className="text-gray-400 italic">—</span>}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">{fmtPos(row.previous.position)}</td>
        <td className="px-4 py-3 text-right tabular-nums">{fmtPos(row.current.position)}</td>
        <td className={`px-4 py-3 text-right tabular-nums ${deltaClass}`}>
          +{fmtPos(row.positionDelta)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-600">
          {row.previous.impressions.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-600">
          {row.clicksDelta > 0 ? "+" : ""}
          {row.clicksDelta}
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || !row.topQuery}
            className="rounded-md bg-gray-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            title={!row.topQuery ? "No top query found for this page" : "Run gap analysis"}
          >
            {isAnalyzing ? "Analyzing…" : analysis ? "Re-run" : "Analyze gaps"}
          </button>
          {(analysis || error) && (
            <button
              onClick={onToggle}
              className="ml-2 rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            >
              {isOpen ? "Hide" : "Show"}
            </button>
          )}
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={8} className="px-4 py-4 bg-gray-50">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {!error && !analysis && (
              <div className="text-sm text-gray-400 animate-pulse">
                Running SERP lookup, scraping competitors, and analyzing gaps…
              </div>
            )}
            {analysis && <AnalysisPanel analysis={analysis} />}
          </td>
        </tr>
      )}
    </>
  );
}

function AnalysisPanel({ analysis }: { analysis: AnalyzeResponse }) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Summary &middot; keyword: <span className="text-gray-800">{analysis.keyword}</span>
          {analysis.userRank ? ` · your rank: #${analysis.userRank}` : " · not in top 10"}
        </p>
        <p className="text-sm text-gray-800 leading-relaxed">{analysis.summary}</p>
      </div>

      {analysis.competitorsAnalyzed.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Competitors above you (analyzed)
          </p>
          <ul className="text-sm space-y-1">
            {analysis.competitorsAnalyzed.map((c) => (
              <li key={c.url} className="flex gap-2">
                <span className="text-gray-400 tabular-nums w-6">#{c.rank}</span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {c.title || c.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.gaps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Content gaps
          </p>
          <ul className="space-y-3">
            {analysis.gaps.map((g, i) => (
              <li key={i} className="border border-gray-100 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${severityClasses(
                      g.severity,
                    )}`}
                  >
                    {g.severity}
                  </span>
                  <span className="text-xs text-gray-500">{categoryLabel(g.category)}</span>
                </div>
                <p className="text-sm text-gray-900">{g.finding}</p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-gray-700">Recommendation:</span>{" "}
                  {g.recommendation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.quickWins.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
            Quick wins
          </p>
          <ul className="list-disc list-inside text-sm text-emerald-900 space-y-1">
            {analysis.quickWins.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
