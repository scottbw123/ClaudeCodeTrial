"use client";

import { useEffect, useRef, useState } from "react";
import { getNavHeight } from "./navHeight";

const CASES = 3;
const VH_PER_CASE = 1.1;

const cases = [
  {
    company: "SaaS Platform",
    industry: "B2B Software",
    metric: "+412%",
    metricLabel: "Organic Traffic",
    period: "6-month engagement",
    accent: "#2563eb",
    accentBg: "#eff6ff",
    accentBorder: "#bfdbfe",
    stats: [
      { value: "+22", label: "Domain authority" },
      { value: "34", label: "Keywords at #1" },
      { value: "80", label: "Content pieces" },
      { value: "1,200+", label: "Errors resolved" },
    ],
    results: [
      "Resolved 1,200+ technical crawl errors in sprint one",
      "Rebuilt site architecture around topical authority clusters",
      "Shipped 80 pillar and supporting content pieces",
      "34 high-value keywords now holding position #1",
      "Domain authority grew 22 points over 6 months",
    ],
    chartData: [0, 0.07, 0.17, 0.32, 0.54, 0.76, 1.0],
    chartLabels: ["M1", "M2", "M3", "M4", "M5", "M6"],
  },
  {
    company: "DTC Brand",
    industry: "Ecommerce",
    metric: "3.8×",
    metricLabel: "Organic Revenue",
    period: "12-month engagement",
    accent: "#0891b2",
    accentBg: "#ecfeff",
    accentBorder: "#a5f3fc",
    stats: [
      { value: "140", label: "Backlinks placed" },
      { value: "−14", label: "Avg. position lift" },
      { value: "62%", label: "Session growth" },
      { value: "3.8×", label: "Revenue from SEO" },
    ],
    results: [
      "Overhauled category page architecture site-wide",
      "Placed 140 editorial backlinks in 12 months",
      "Deployed product schema across 4,000+ SKUs",
      "Average SERP position improved by 14 spots",
      "Organic now drives 3.8× pre-engagement revenue",
    ],
    chartData: [0, 0.05, 0.12, 0.24, 0.40, 0.58, 0.74, 0.88, 1.0],
    chartLabels: ["Q1", "Q2", "Q3", "Q4"],
  },
  {
    company: "Regional Law Firm",
    industry: "Professional Services",
    metric: "#1",
    metricLabel: "Local Pack",
    period: "In 12 target cities",
    accent: "#7c3aed",
    accentBg: "#f5f3ff",
    accentBorder: "#ddd6fe",
    stats: [
      { value: "12", label: "Cities at #1" },
      { value: "80+", label: "Citations cleaned" },
      { value: "38", label: "Local backlinks" },
      { value: "4.9★", label: "Review average" },
    ],
    results: [
      "Cleaned citations across 80+ business directories",
      "Optimized Google Business Profile per city market",
      "Built geo-targeted landing pages for each location",
      "Launched review velocity strategy — 4.9★ average",
      "Secured 38 local editorial backlinks in 6 months",
    ],
    chartData: [0, 0.06, 0.14, 0.28, 0.50, 0.74, 0.90, 1.0],
    chartLabels: ["M1", "M2", "M3", "M4", "M5", "M6"],
  },
];

function Chart({ data, labels, accent }: { data: number[]; labels: string[]; accent: string }) {
  const W = 360;
  const H = 140;
  const PL = 0; const PR = 8; const PT = 12; const PB = 24;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const pts = data.map((v, i) => ({
    x: PL + (i / (data.length - 1)) * cW,
    y: PT + (1 - v) * cH,
  }));

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${H - PB} L${pts[0].x},${H - PB} Z`;
  const gId = `g${accent.replace("#", "")}`;

  // Evenly spaced x-label positions
  const xPts = labels.map((_, i) => PL + (i / (labels.length - 1)) * cW);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.33, 0.66, 1].map((v) => (
        <line key={v} x1={PL} y1={PT + (1 - v) * cH} x2={W - PR} y2={PT + (1 - v) * cH}
          stroke="#e2e8f0" strokeWidth="0.75" />
      ))}
      <path d={area} fill={`url(#${gId})`} />
      <path d={line} stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={accent} strokeWidth="1.5" />
      ))}
      {xPts.map((x, i) => (
        <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">{labels[i]}</text>
      ))}
    </svg>
  );
}

export default function ScrollCaseStudies() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const pendingIndex = useRef(0);

  useEffect(() => {
    const setHeights = () => {
      const navH = getNavHeight();
      const avail = window.innerHeight - navH;
      if (containerRef.current) containerRef.current.style.height = `${avail * CASES * VH_PER_CASE}px`;
      if (stickyRef.current) {
        stickyRef.current.style.top = `${navH}px`;
        stickyRef.current.style.height = `${avail}px`;
      }
    };
    setHeights();
    window.addEventListener("resize", setHeights);
    return () => window.removeEventListener("resize", setHeights);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const navH = getNavHeight();
      const avail = window.innerHeight - navH;
      const total = rect.height - avail;
      const scrolled = navH - rect.top;
      const pct = Math.max(0, Math.min(1, scrolled / total));
      const index = Math.min(CASES - 1, Math.floor(pct * CASES));
      if (index !== pendingIndex.current) {
        pendingIndex.current = index;
        setVisible(false);
        clearTimeout(timer);
        timer = setTimeout(() => { setDisplayIndex(index); setVisible(true); }, 280);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => { window.removeEventListener("scroll", handleScroll); clearTimeout(timer); };
  }, []);

  const c = cases[displayIndex];

  return (
    <div ref={containerRef} className="relative">
      <div ref={stickyRef} className="sticky overflow-hidden flex flex-col bg-white">

        {/* Section header */}
        <div className="flex-shrink-0 border-b border-slate-200 px-8 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Case Studies</p>
            <div className="flex items-center gap-1.5">
              {cases.map((_, i) => (
                <button key={i}
                  className="text-xs font-bold px-2 py-0.5 rounded transition-all duration-300"
                  style={{
                    color: i === displayIndex ? c.accent : "#94a3b8",
                    backgroundColor: i === displayIndex ? c.accentBg : "transparent",
                  }}>
                  {String(i + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-900 hidden md:block">Real results, real companies</h2>
        </div>

        {/* Content */}
        <div
          className="flex-1 grid grid-cols-1 lg:grid-cols-[38%_62%] min-h-0 transition-all duration-300"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)" }}
        >
          {/* LEFT */}
          <div className="flex flex-col justify-between px-8 md:px-12 py-8 border-r border-slate-100 min-h-0">
            {/* Company */}
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{ color: c.accent, backgroundColor: c.accentBg, borderColor: c.accentBorder }}>
                {c.industry}
              </span>
              <p className="text-slate-800 font-semibold text-base mt-2">{c.company}</p>
              <p className="text-slate-400 text-xs mt-0.5">{c.period}</p>
            </div>

            {/* Primary metric */}
            <div className="py-6 border-y border-slate-100">
              <div className="text-5xl font-extrabold tracking-tight leading-none" style={{ color: c.accent }}>
                {c.metric}
              </div>
              <p className="text-slate-600 text-sm font-medium mt-2">{c.metricLabel}</p>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 gap-2">
              {c.stats.map((s) => (
                <div key={s.label} className="rounded-lg px-3 py-2.5 border"
                  style={{ backgroundColor: c.accentBg, borderColor: c.accentBorder }}>
                  <div className="text-xl font-bold leading-none" style={{ color: c.accent }}>{s.value}</div>
                  <div className="text-slate-500 text-xs mt-1 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col px-8 md:px-10 py-8 min-h-0 overflow-hidden gap-5">
            {/* Chart */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Growth trend</span>
                <span className="text-xs text-slate-300">{c.period}</span>
              </div>
              <div className="flex-1 min-h-0 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <Chart data={c.chartData} labels={c.chartLabels} accent={c.accent} />
              </div>
            </div>

            {/* Results */}
            <div className="flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-400">What we delivered</p>
              <ul className="space-y-2">
                {c.results.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                      stroke={c.accent} strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600 text-sm leading-snug">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
          <div className="h-full transition-all duration-300"
            style={{ width: `${((displayIndex + 1) / CASES) * 100}%`, backgroundColor: c.accent }} />
        </div>
      </div>
    </div>
  );
}
