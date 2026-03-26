"use client";

import { useEffect, useRef, useState } from "react";

const services = [
  {
    title: "Technical SEO",
    description: "Core Web Vitals, crawlability, indexation, site architecture, and speed optimization — the foundation every high-performing site needs.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.4" />
        <circle cx="40" cy="40" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
        <path d="M26 40 L40 26 L54 40 L40 54 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
        <circle cx="40" cy="40" r="6" fill="currentColor" />
        <path d="M40 14 L40 20 M40 60 L40 66 M14 40 L20 40 M60 40 L66 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    bg: "#07090f",
    accent: "#3b82f6",
    accentLight: "#93c5fd",
    stat: "47%",
    statLabel: "of sites have critical crawl errors",
  },
  {
    title: "Link Building",
    description: "White-hat authority building through digital PR, editorial placements, and strategic partnerships that move the needle on domain authority.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <path d="M32 48 L20 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M48 32 L60 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 38 L22 44 C16 50 16 58 22 64 C28 70 36 70 42 64 L48 58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M52 42 L58 36 C64 30 64 22 58 16 C52 10 44 10 38 16 L32 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M34 46 L46 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    bg: "#060e09",
    accent: "#10b981",
    accentLight: "#6ee7b7",
    stat: "#1",
    statLabel: "Google ranking factor is backlinks",
  },
  {
    title: "Content Strategy",
    description: "Keyword-mapped content plans, topical authority clusters, and high-intent copy that converts organic visitors into paying customers.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <rect x="14" y="12" width="52" height="56" rx="5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.06" />
        <path d="M24 26 L56 26 M24 36 L56 36 M24 46 L46 46 M24 56 L38 56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="57" cy="57" r="11" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
        <path d="M53 57 L57 61 L63 53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    bg: "#0d0a04",
    accent: "#f59e0b",
    accentLight: "#fcd34d",
    stat: "55%",
    statLabel: "more traffic for companies with active blogs",
  },
  {
    title: "Local SEO",
    description: "Dominate Google Maps and local pack results. We optimize your presence across every city and market you operate in.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <path d="M40 14 C28 14 18 24 18 36 C18 52 40 68 40 68 C40 68 62 52 62 36 C62 24 52 14 40 14 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
        <circle cx="40" cy="36" r="8" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 72 Q30 66 40 72 Q50 78 60 72" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    bg: "#0d0606",
    accent: "#ef4444",
    accentLight: "#fca5a5",
    stat: "46%",
    statLabel: "of all Google searches have local intent",
  },
  {
    title: "Ecommerce SEO",
    description: "Category page optimization, product schema markup, faceted navigation fixes, and merchant feed strategies for DTC and retail brands.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <path d="M12 18 L20 18 L28 52 L58 52 L66 28 L22 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="62" r="5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="52" cy="62" r="5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M40 28 L40 46 M33 37 L47 37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    bg: "#08060e",
    accent: "#8b5cf6",
    accentLight: "#c4b5fd",
    stat: "53%",
    statLabel: "of ecommerce traffic comes from organic search",
  },
  {
    title: "SEO Analytics",
    description: "Custom dashboards, rank tracking, attribution reporting, and monthly strategy reviews tied directly to revenue impact.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <path d="M12 60 L26 44 L36 52 L50 32 L68 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 60 L68 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <circle cx="26" cy="44" r="3.5" fill="currentColor" />
        <circle cx="36" cy="52" r="3.5" fill="currentColor" />
        <circle cx="50" cy="32" r="3.5" fill="currentColor" />
        <circle cx="68" cy="20" r="3.5" fill="currentColor" />
        <rect x="16" y="50" width="8" height="10" rx="1.5" fill="currentColor" fillOpacity="0.25" />
        <rect x="30" y="42" width="8" height="18" rx="1.5" fill="currentColor" fillOpacity="0.3" />
        <rect x="44" y="34" width="8" height="26" rx="1.5" fill="currentColor" fillOpacity="0.35" />
        <rect x="58" y="26" width="8" height="34" rx="1.5" fill="currentColor" fillOpacity="0.4" />
      </svg>
    ),
    bg: "#04100e",
    accent: "#06b6d4",
    accentLight: "#67e8f9",
    stat: "6×",
    statLabel: "better ROI from data-driven SEO programs",
  },
];

export default function ScrollServices() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = Math.max(0, Math.min(1, scrolled / total));
      const rawIndex = pct * services.length;
      const index = Math.min(services.length - 1, Math.floor(rawIndex));
      const within = rawIndex - index;
      setActiveIndex(index);
      setContentVisible(within < 0.82 || index === services.length - 1);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const s = services[activeIndex];

  return (
    <div ref={containerRef} style={{ height: `${services.length * 80}vh` }} className="relative">
      <div
        className="sticky top-0 h-screen overflow-hidden flex flex-col transition-colors duration-700"
        style={{ backgroundColor: s.bg }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 65% 60%, ${s.accent}18 0%, transparent 65%)` }}
        />

        {/* ── PERSISTENT HEADER ── */}
        <div className="relative z-10 flex-shrink-0 pt-8 pb-5 px-6 md:px-12 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1.5 transition-colors duration-500" style={{ color: s.accent }}>
                Services
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Everything your SEO needs, nothing it doesn&apos;t
              </h2>
            </div>
            {/* Step dots */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0 pb-1">
              {services.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-400"
                  style={{
                    width: i === activeIndex ? "20px" : "6px",
                    height: "6px",
                    backgroundColor: i === activeIndex ? s.accent : i < activeIndex ? `${s.accent}50` : "rgba(255,255,255,0.12)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── CHANGING CONTENT ── */}
        <div className="relative z-10 flex-1 flex items-center px-6 md:px-12 overflow-hidden">
          <div
            className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-500"
            style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateY(0)" : "translateY(18px)" }}
          >
            {/* Left */}
            <div>
              <p className="text-sm font-bold uppercase tracking-widest mb-4 transition-colors duration-500" style={{ color: s.accent }}>
                {String(activeIndex + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
              </p>
              <h3 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-none mb-5">
                {s.title}
              </h3>
              <p className="text-zinc-300 text-base md:text-lg leading-relaxed mb-8 max-w-md">
                {s.description}
              </p>
              <div
                className="inline-flex items-baseline gap-3 px-5 py-3 rounded-xl border"
                style={{ borderColor: `${s.accent}35`, backgroundColor: `${s.accent}0e` }}
              >
                <span className="text-3xl font-extrabold" style={{ color: s.accentLight }}>{s.stat}</span>
                <span className="text-zinc-400 text-sm">{s.statLabel}</span>
              </div>
            </div>

            {/* Right: icon */}
            <div className="hidden lg:flex items-center justify-center">
              <div
                className="flex items-center justify-center rounded-full transition-all duration-700"
                style={{
                  width: 300,
                  height: 300,
                  background: `radial-gradient(circle, ${s.accent}12 0%, transparent 70%)`,
                  border: `1px solid ${s.accent}18`,
                  color: s.accent,
                  padding: "60px",
                }}
              >
                {s.icon}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${((activeIndex / services.length) + (1 / services.length)) * 100}%`,
              backgroundColor: s.accent,
            }}
          />
        </div>
      </div>
    </div>
  );
}
