"use client";

import { useEffect, useRef, useState } from "react";

const cases = [
  {
    company: "SaaS Platform",
    industry: "B2B Software",
    metric: "+412%",
    metricSub: "Organic Traffic",
    period: "6 months",
    accent: "#3b82f6",
    accentLight: "#93c5fd",
    bg: "#070a10",
    results: [
      { label: "Rebuilt site architecture end-to-end", type: "arch" },
      { label: "Fixed 1,200+ critical crawl errors", type: "fix" },
      { label: "Published 80 pillar content pieces", type: "content" },
      { label: "Domain authority increased +22 pts", type: "authority" },
      { label: "Ranked #1 for 34 target keywords", type: "rank" },
    ],
    chartPoints: "0,55 16,48 32,42 48,34 64,22 80,14 96,6 112,2",
  },
  {
    company: "DTC Brand",
    industry: "Ecommerce",
    metric: "3.8×",
    metricSub: "Organic Revenue",
    period: "12 months",
    accent: "#06b6d4",
    accentLight: "#67e8f9",
    bg: "#04100e",
    results: [
      { label: "Category page SEO overhaul", type: "arch" },
      { label: "140 editorial backlinks acquired", type: "authority" },
      { label: "Product schema markup deployed", type: "fix" },
      { label: "Average position improved 14 spots", type: "rank" },
      { label: "Cart abandonment reduced via CRO", type: "content" },
    ],
    chartPoints: "0,58 16,52 32,46 48,36 64,28 80,18 96,10 112,4",
  },
  {
    company: "Law Firm",
    industry: "Professional Services",
    metric: "#1",
    metricSub: "Local Pack",
    period: "In 12 cities",
    accent: "#8b5cf6",
    accentLight: "#c4b5fd",
    bg: "#09060f",
    results: [
      { label: "Full citation cleanup across 80+ dirs", type: "fix" },
      { label: "Google Business Profile optimized", type: "arch" },
      { label: "Geo-targeted content for each city", type: "content" },
      { label: "Review velocity strategy launched", type: "rank" },
      { label: "Local backlinks from 38 publications", type: "authority" },
    ],
    chartPoints: "0,60 16,54 32,46 48,38 64,28 80,18 96,8 112,3",
  },
];

function BarChart({ accent, points }: { accent: string; points: string }) {
  return (
    <svg viewBox="0 0 120 70" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id={`grad-${accent.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[15, 30, 45, 60].map((y) => (
        <line key={y} x1="0" y1={y} x2="120" y2={y} stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
      ))}
      {/* Area fill */}
      <polygon
        points={`0,55 ${points} 112,65 0,65`}
        fill={`url(#grad-${accent.replace("#", "")})`}
      />
      {/* Line */}
      <polyline points={points} stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.split(" ").map((pt, i) => {
        const [x, y] = pt.split(",");
        return <circle key={i} cx={x} cy={y} r="2.5" fill={accent} />;
      })}
    </svg>
  );
}

function ResultIcon({ type, color }: { type: string; color: string }) {
  const icons: Record<string, JSX.Element> = {
    arch: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0">
        <rect x="1" y="5" width="14" height="9" rx="1.5" stroke={color} strokeWidth="1.2" />
        <path d="M5 5 V3 Q8 1 11 3 V5" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
    fix: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0">
        <path d="M8 2 L8 14 M2 8 L14 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <circle cx="8" cy="8" r="5" stroke={color} strokeWidth="1.2" />
        <circle cx="8" cy="8" r="2" fill={color} />
      </svg>
    ),
    content: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke={color} strokeWidth="1.2" />
        <path d="M5 6 L11 6 M5 9 L9 9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    authority: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0">
        <path d="M8 2 L9.8 6.8 L15 6.8 L10.6 9.8 L12.4 14.5 L8 11.5 L3.6 14.5 L5.4 9.8 L1 6.8 L6.2 6.8 Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
    rank: (
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0">
        <path d="M2 12 L5 8 L8 10 L11 5 L14 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 2 L14 2 L14 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };
  return icons[type] ?? icons.rank;
}

export default function ScrollCaseStudies() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [rightVisible, setRightVisible] = useState(true);
  const [leftOffset, setLeftOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = Math.max(0, Math.min(1, scrolled / total));
      const rawIndex = pct * cases.length;
      const index = Math.min(cases.length - 1, Math.floor(rawIndex));
      const within = rawIndex - index;

      setActiveIndex(index);
      // Left slot: offset by full index (each case = 100% height)
      setLeftOffset(rawIndex);
      // Right fades out near end of each case
      setRightVisible(within < 0.8 || index === cases.length - 1);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const current = cases[activeIndex];

  return (
    <div ref={containerRef} style={{ height: `${cases.length * 100}vh` }} className="relative">
      <div
        className="sticky top-0 h-screen overflow-hidden flex flex-col transition-colors duration-700"
        style={{ backgroundColor: current.bg }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 30% 55%, ${current.accent}14 0%, transparent 60%)` }}
        />

        {/* Section header */}
        <div className="relative z-10 flex-shrink-0 pt-8 pb-5 px-6 md:px-12 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: current.accent }}>
                Case Studies
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Real results, real companies
              </h2>
            </div>
            {/* Case indicators */}
            <div className="hidden md:flex items-center gap-3 pb-1">
              {cases.map((c, i) => (
                <div
                  key={i}
                  className="text-xs font-semibold transition-colors duration-300"
                  style={{ color: i === activeIndex ? current.accent : i < activeIndex ? "rgba(255,255,255,0.25)" : "#3f3f46" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[45%_55%] overflow-hidden">

          {/* LEFT — slot machine metric */}
          <div className="relative overflow-hidden border-r border-white/5 flex flex-col justify-center px-8 md:px-12">
            <div
              className="transition-transform duration-500 ease-out"
              style={{ transform: `translateY(-${leftOffset * (100 / cases.length)}%)`, height: `${cases.length * 100}%` }}
            >
              {cases.map((c) => (
                <div
                  key={c.company}
                  className="flex flex-col justify-center"
                  style={{ height: `${100 / cases.length}%` }}
                >
                  <div className="text-sm font-semibold mb-1" style={{ color: c.accent }}>
                    {c.company} · {c.industry}
                  </div>
                  <div
                    className="font-extrabold leading-none tracking-tighter mb-2"
                    style={{
                      fontSize: "clamp(4rem, 10vw, 7.5rem)",
                      color: c.accentLight,
                    }}
                  >
                    {c.metric}
                  </div>
                  <div className="text-white text-xl font-bold mb-1">{c.metricSub}</div>
                  <div className="text-zinc-500 text-sm">{c.period}</div>

                  {/* Mini chart */}
                  <div className="mt-6 w-full max-w-[200px]" style={{ height: "60px" }}>
                    <BarChart accent={c.accent} points={c.chartPoints} />
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">Organic traffic trend</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — results list, fades */}
          <div
            className="flex flex-col justify-center px-8 md:px-12 transition-all duration-400"
            style={{ opacity: rightVisible ? 1 : 0, transform: rightVisible ? "translateY(0)" : "translateY(12px)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: current.accent }}>
              What we delivered
            </p>
            <ul className="space-y-5">
              {current.results.map((r, i) => (
                <li
                  key={r.label}
                  className="flex items-start gap-4"
                  style={{
                    opacity: rightVisible ? 1 : 0,
                    transform: rightVisible ? "translateX(0)" : "translateX(12px)",
                    transition: `opacity 0.4s ease ${i * 60}ms, transform 0.4s ease ${i * 60}ms`,
                  }}
                >
                  <ResultIcon type={r.type} color={current.accent} />
                  <span className="text-zinc-200 text-sm leading-relaxed">{r.label}</span>
                </li>
              ))}
            </ul>

            {/* Large decorative bar chart */}
            <div
              className="mt-10 rounded-xl p-4 border border-white/5"
              style={{ backgroundColor: `${current.accent}08`, width: "100%", maxWidth: "320px" }}
            >
              <div className="text-xs text-zinc-500 mb-3">Monthly organic sessions</div>
              <div style={{ height: "70px" }}>
                <BarChart accent={current.accent} points={current.chartPoints} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-zinc-600">
                <span>Month 1</span>
                <span>Month 6</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${((activeIndex / cases.length) + (1 / cases.length)) * 100}%`,
              backgroundColor: current.accent,
            }}
          />
        </div>
      </div>
    </div>
  );
}
