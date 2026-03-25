"use client";

import { useEffect, useRef, useState } from "react";

const services = [
  {
    title: "Technical SEO",
    description:
      "Core Web Vitals, crawlability, indexation, site architecture, and speed optimization — the foundation every high-performing site needs.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-20 h-20">
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3" />
        <path d="M20 32 L32 20 L44 32 L32 44 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
        <circle cx="32" cy="32" r="5" fill="currentColor" />
        <path d="M32 10 L32 16 M32 48 L32 54 M10 32 L16 32 M48 32 L54 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    bg: "bg-[#06090f]",
    gradientFrom: "#0a1628",
    accent: "#3b82f6",
    accentLight: "#93c5fd",
    stat: "47%",
    statLabel: "of sites have critical crawl errors",
  },
  {
    title: "Link Building",
    description:
      "White-hat authority building through digital PR, editorial placements, and strategic partnerships that move the needle on domain authority.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-20 h-20">
        <path d="M26 38 L16 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M38 26 L48 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22 30 L18 34 C14 38 14 44 18 48 C22 52 28 52 32 48 L36 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M42 34 L46 30 C50 26 50 20 46 16 C42 12 36 12 32 16 L28 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 36 L36 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    bg: "bg-[#060f0a]",
    gradientFrom: "#0a2818",
    accent: "#10b981",
    accentLight: "#6ee7b7",
    stat: "#1",
    statLabel: "Google ranking factor is backlinks",
  },
  {
    title: "Content Strategy",
    description:
      "Keyword-mapped content plans, topical authority clusters, and high-intent copy that converts organic visitors into paying customers.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-20 h-20">
        <rect x="12" y="10" width="40" height="44" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
        <path d="M20 20 L44 20 M20 28 L44 28 M20 36 L36 36 M20 44 L30 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="46" cy="46" r="8" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
        <path d="M43 46 L46 49 L51 43" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    bg: "bg-[#0e0a04]",
    gradientFrom: "#1e1406",
    accent: "#f59e0b",
    accentLight: "#fcd34d",
    stat: "55%",
    statLabel: "more traffic for companies with active blogs",
  },
  {
    title: "Local SEO",
    description:
      "Dominate Google Maps and local pack results. We optimize your presence across every city and market you operate in.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-20 h-20">
        <path d="M32 12 C23 12 16 19 16 28 C16 40 32 54 32 54 C32 54 48 40 48 28 C48 19 41 12 32 12 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
        <circle cx="32" cy="28" r="6" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" />
        <path d="M16 56 Q24 52 32 56 Q40 60 48 56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    bg: "bg-[#0f0606]",
    gradientFrom: "#1e0a0a",
    accent: "#ef4444",
    accentLight: "#fca5a5",
    stat: "46%",
    statLabel: "of all Google searches have local intent",
  },
  {
    title: "Ecommerce SEO",
    description:
      "Category page optimization, product schema markup, faceted navigation fixes, and merchant feed strategies for DTC and retail brands.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-20 h-20">
        <path d="M10 14 L16 14 L22 40 L46 40 L52 22 L18 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="26" cy="48" r="4" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="2" />
        <circle cx="42" cy="48" r="4" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="2" />
        <path d="M32 22 L32 36 M26 29 L38 29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    bg: "bg-[#09060f]",
    gradientFrom: "#130a1e",
    accent: "#8b5cf6",
    accentLight: "#c4b5fd",
    stat: "53%",
    statLabel: "of ecommerce traffic comes from organic search",
  },
  {
    title: "SEO Analytics",
    description:
      "Custom dashboards, rank tracking, attribution reporting, and monthly strategy reviews tied directly to revenue impact.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-20 h-20">
        <path d="M10 48 L22 34 L30 40 L40 24 L54 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 48 L54 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <circle cx="22" cy="34" r="3" fill="currentColor" />
        <circle cx="30" cy="40" r="3" fill="currentColor" />
        <circle cx="40" cy="24" r="3" fill="currentColor" />
        <circle cx="54" cy="16" r="3" fill="currentColor" />
        <rect x="14" y="50" width="6" height="6" rx="1" fill="currentColor" fillOpacity="0.3" />
        <rect x="26" y="44" width="6" height="12" rx="1" fill="currentColor" fillOpacity="0.3" />
        <rect x="38" y="38" width="6" height="18" rx="1" fill="currentColor" fillOpacity="0.3" />
      </svg>
    ),
    bg: "bg-[#040e0e]",
    gradientFrom: "#051818",
    accent: "#06b6d4",
    accentLight: "#67e8f9",
    stat: "6×",
    statLabel: "better ROI from data-driven SEO programs",
  },
];

export default function ScrollServices() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = Math.max(0, Math.min(1, scrolled / total));
      const rawIndex = pct * services.length;
      const index = Math.min(services.length - 1, Math.floor(rawIndex));
      const withinItem = rawIndex - index;

      setProgress(pct);
      setActiveIndex(index);
      setVisible(withinItem < 0.85 || index === services.length - 1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const current = services[activeIndex];

  return (
    <div
      ref={containerRef}
      style={{ height: `${services.length * 100}vh` }}
      className="relative"
    >
      <div
        className="sticky top-0 h-screen overflow-hidden transition-colors duration-700"
        style={{ backgroundColor: current.bg.replace("bg-[", "").replace("]", "") }}
      >
        {/* Background gradient blob */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(ellipse at 60% 50%, ${current.accent}18 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full items-center">
            {/* Left: text */}
            <div
              className="transition-all duration-500"
              style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
            >
              {/* Step indicator */}
              <div className="flex items-center gap-3 mb-8">
                {services.map((_, i) => (
                  <div
                    key={i}
                    className="h-0.5 rounded-full transition-all duration-500"
                    style={{
                      width: i === activeIndex ? "32px" : "12px",
                      backgroundColor: i === activeIndex ? current.accent : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>

              <p
                className="text-sm font-semibold uppercase tracking-widest mb-4 transition-colors duration-500"
                style={{ color: current.accent }}
              >
                {String(activeIndex + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
              </p>

              <h3 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-none mb-6">
                {current.title}
              </h3>

              <p className="text-zinc-300 text-lg leading-relaxed mb-10 max-w-md">
                {current.description}
              </p>

              {/* Stat */}
              <div
                className="inline-flex items-baseline gap-3 px-5 py-3 rounded-xl border"
                style={{
                  borderColor: `${current.accent}40`,
                  backgroundColor: `${current.accent}10`,
                }}
              >
                <span
                  className="text-3xl font-extrabold"
                  style={{ color: current.accentLight }}
                >
                  {current.stat}
                </span>
                <span className="text-zinc-400 text-sm">{current.statLabel}</span>
              </div>
            </div>

            {/* Right: icon */}
            <div
              className="hidden lg:flex items-center justify-center transition-all duration-500"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.9)",
                color: current.accent,
              }}
            >
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: "340px",
                  height: "340px",
                  background: `radial-gradient(circle, ${current.accent}15 0%, transparent 70%)`,
                  borderRadius: "50%",
                  border: `1px solid ${current.accent}20`,
                }}
              >
                <div style={{ width: "160px", height: "160px", color: current.accent }}>
                  {current.icon}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: current.accent,
            }}
          />
        </div>

        {/* Scroll hint */}
        {activeIndex === 0 && progress < 0.05 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500 text-xs animate-bounce">
            <span>Scroll to explore</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
