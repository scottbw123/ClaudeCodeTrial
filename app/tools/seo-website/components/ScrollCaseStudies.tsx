"use client";

import { useEffect, useRef, useState } from "react";
import { getNavHeight } from "./navHeight";

const CASES = 3;
const VH_PER_CASE = 1.1;

const cases = [
  {
    company: "SaaS Platform",
    industry: "B2B Software",
    headline: "+412%",
    headlineSub: "Organic Traffic",
    period: "Over 6 months",
    accent: "#3b82f6",
    accentLight: "#93c5fd",
    bg: "#070a12",
    secondaryStats: [
      { value: "+22", label: "Domain authority" },
      { value: "34", label: "Keywords at #1" },
      { value: "80", label: "Content pieces" },
      { value: "1,200+", label: "Issues fixed" },
    ],
    results: [
      "Full technical crawl — 1,200+ errors resolved in sprint one",
      "Site architecture rebuilt for topical authority",
      "80 pillar and cluster content pieces shipped",
      "34 target keywords now holding position #1",
      "Domain authority climbed 22 points in 6 months",
    ],
    // Normalized chart data: [month, normalized_value_0_to_1]
    chartData: [0, 0.07, 0.16, 0.30, 0.52, 0.75, 1.0],
    chartLabels: ["M1", "M2", "M3", "M4", "M5", "M6"],
    chartYLabels: ["100%", "75%", "50%", "25%", "0%"],
  },
  {
    company: "DTC Brand",
    industry: "Ecommerce",
    headline: "3.8×",
    headlineSub: "Organic Revenue",
    period: "Over 12 months",
    accent: "#06b6d4",
    accentLight: "#67e8f9",
    bg: "#04100f",
    secondaryStats: [
      { value: "140", label: "Backlinks built" },
      { value: "−14", label: "Avg. rank change" },
      { value: "62%", label: "More sessions" },
      { value: "3.8×", label: "Revenue lift" },
    ],
    results: [
      "Category page architecture overhauled site-wide",
      "140 editorial backlinks placed in 12 months",
      "Product schema markup deployed across 4,000 SKUs",
      "Average SERP position improved by 14 spots",
      "Cart abandonment reduced through CRO layer",
    ],
    chartData: [0, 0.05, 0.13, 0.24, 0.38, 0.55, 0.70, 0.83, 0.93, 1.0],
    chartLabels: ["Q1", "Q2", "Q3", "Q4"],
    chartYLabels: ["3.8×", "3×", "2×", "1×"],
  },
  {
    company: "Regional Law Firm",
    industry: "Professional Services",
    headline: "#1",
    headlineSub: "Local Pack",
    period: "In 12 target cities",
    accent: "#8b5cf6",
    accentLight: "#c4b5fd",
    bg: "#09060f",
    secondaryStats: [
      { value: "12", label: "Cities ranking #1" },
      { value: "80+", label: "Citations cleaned" },
      { value: "38", label: "Local backlinks" },
      { value: "4.9★", label: "Avg. review score" },
    ],
    results: [
      "Citation cleanup across 80+ directories nationwide",
      "Google Business Profile fully optimized per city",
      "Geo-targeted landing pages built for each market",
      "Review velocity strategy launched — 4.9★ average",
      "38 local editorial backlinks placed in 6 months",
    ],
    chartData: [0, 0.06, 0.15, 0.30, 0.50, 0.73, 0.90, 1.0],
    chartLabels: ["M1", "M2", "M3", "M4", "M5", "M6"],
    chartYLabels: ["12", "9", "6", "3", "0"],
  },
];

function GrowthChart({ data, labels, accent, accentLight }: {
  data: number[];
  labels: string[];
  accent: string;
  accentLight: string;
}) {
  const W = 400;
  const H = 180;
  const PAD = { top: 16, right: 12, bottom: 28, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const pts = data.map((v, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + (1 - v) * chartH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${H - PAD.bottom} L${pts[0].x},${H - PAD.bottom} Z`;

  // X label positions (evenly spaced)
  const xLabelPositions = labels.map((_, i) =>
    PAD.left + (i / (labels.length - 1)) * chartW
  );

  const gradId = `cg-${accent.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => {
        const y = PAD.top + (1 - v) * chartH;
        return (
          <line key={v} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
            stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
        );
      })}

      {/* Area */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={linePath} stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={accentLight} stroke="#000" strokeWidth="1" />
      ))}

      {/* X axis labels */}
      {xLabelPositions.map((x, i) => (
        <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)">
          {labels[i]}
        </text>
      ))}

      {/* Baseline */}
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom}
        stroke="white" strokeOpacity="0.08" strokeWidth="0.5" />
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
    let fadeTimer: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const navH = getNavHeight();
      const avail = window.innerHeight - navH;
      const total = rect.height - avail;
      const scrolled = navH - rect.top;
      const pct = Math.max(0, Math.min(1, scrolled / total));
      const raw = pct * CASES;
      const index = Math.min(CASES - 1, Math.floor(raw));

      if (index !== pendingIndex.current) {
        pendingIndex.current = index;
        setVisible(false);
        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(() => {
          setDisplayIndex(index);
          setVisible(true);
        }, 320);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(fadeTimer);
    };
  }, []);

  const c = cases[displayIndex];

  return (
    <div ref={containerRef} className="relative">
      <div ref={stickyRef} className="sticky overflow-hidden flex flex-col transition-colors duration-500"
        style={{ backgroundColor: c.bg }}>

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 25% 60%, ${c.accent}12 0%, transparent 60%)` }} />

        {/* Section header */}
        <div className="relative z-10 flex-shrink-0 pt-7 pb-5 px-6 md:px-12 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1.5 transition-colors duration-500" style={{ color: c.accent }}>
                Case Studies
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Real results, real companies</h2>
            </div>
            <div className="hidden md:flex items-center gap-3 pb-1">
              {cases.map((_, i) => (
                <div key={i} className="text-xs font-bold transition-all duration-400 px-1"
                  style={{ color: i === displayIndex ? c.accent : i < displayIndex ? "rgba(255,255,255,0.2)" : "#3f3f46" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div
          className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[42%_58%] min-h-0 transition-all duration-350"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)" }}
        >
          {/* LEFT — metrics */}
          <div className="flex flex-col justify-center px-8 md:px-12 border-r border-white/5 py-6 overflow-hidden">
            <div className="mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: c.accent }}>{c.company}</span>
              <span className="text-zinc-600 text-xs mx-2">·</span>
              <span className="text-zinc-500 text-xs">{c.industry}</span>
            </div>

            {/* Primary metric */}
            <div className="mb-2">
              <div className="font-extrabold leading-none tracking-tighter"
                style={{ fontSize: "clamp(4.5rem, 9vw, 7rem)", color: c.accentLight }}>
                {c.headline}
              </div>
              <div className="text-white text-lg font-bold mt-1">{c.headlineSub}</div>
              <div className="text-zinc-500 text-sm mt-0.5">{c.period}</div>
            </div>

            {/* Divider */}
            <div className="my-5 h-px" style={{ backgroundColor: `${c.accent}20` }} />

            {/* Secondary stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {c.secondaryStats.map((s) => (
                <div key={s.label} className="rounded-lg px-3 py-3 border"
                  style={{ backgroundColor: `${c.accent}08`, borderColor: `${c.accent}18` }}>
                  <div className="text-xl font-extrabold leading-none" style={{ color: c.accentLight }}>{s.value}</div>
                  <div className="text-zinc-500 text-xs mt-1 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — chart + results */}
          <div className="flex flex-col px-8 md:px-10 py-6 min-h-0 overflow-hidden">
            {/* Chart */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Growth trend</span>
                <span className="text-xs text-zinc-600">{c.period}</span>
              </div>
              <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/5"
                style={{ backgroundColor: `${c.accent}06` }}>
                <GrowthChart data={c.chartData} labels={c.chartLabels} accent={c.accent} accentLight={c.accentLight} />
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 h-px flex-shrink-0" style={{ backgroundColor: `${c.accent}15` }} />

            {/* Results */}
            <div className="flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: c.accent }}>
                What we delivered
              </p>
              <ul className="space-y-2.5">
                {c.results.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                      stroke={c.accent} strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-zinc-300 text-sm leading-snug">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5">
          <div className="h-full transition-all duration-300"
            style={{ width: `${((displayIndex + 1) / CASES) * 100}%`, backgroundColor: c.accent }} />
        </div>
      </div>
    </div>
  );
}
