"use client";

import { useEffect, useRef, useState } from "react";
import { getNavHeight } from "./navHeight";

const STEPS = 4;
const VH_PER_STEP = 0.65;

const steps = [
  {
    number: "01",
    title: "Deep-Dive Audit",
    description: "We analyze your site, competitors, and keyword landscape to uncover every growth opportunity. No stone left unturned.",
    tags: ["Technical crawl", "Competitor gap analysis", "Keyword mapping", "Backlink profile review"],
  },
  {
    number: "02",
    title: "Custom Roadmap",
    description: "You receive a prioritized 90-day plan with clear milestones, deliverables, and projected outcomes tied to real revenue.",
    tags: ["90-day sprint plan", "KPI framework", "Content calendar", "Link building pipeline"],
  },
  {
    number: "03",
    title: "Execution Sprint",
    description: "Our team builds links, ships content, and fixes technical issues at a pace that compounds month over month.",
    tags: ["On-page optimization", "Editorial outreach", "Content production", "Technical fixes"],
  },
  {
    number: "04",
    title: "Report & Iterate",
    description: "Monthly reports track every ranking, click, and conversion. We refine the strategy based on data, not guesswork.",
    tags: ["Rank tracking", "Traffic attribution", "Conversion analysis", "Strategy refinement"],
  },
];

export default function ScrollProcess() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const setHeights = () => {
      const navH = getNavHeight();
      const avail = window.innerHeight - navH;
      if (containerRef.current) containerRef.current.style.height = `${avail * STEPS * VH_PER_STEP}px`;
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
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const navH = getNavHeight();
      const avail = window.innerHeight - navH;
      const total = rect.height - avail;
      const scrolled = navH - rect.top;
      const pct = Math.max(0, Math.min(1, scrolled / total));
      const raw = pct * STEPS;
      const index = Math.min(STEPS - 1, Math.floor(raw));
      const within = raw - index;
      setActiveIndex(index);
      setOverallProgress(pct);
      setTextVisible(within < 0.78 || index === STEPS - 1);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const step = steps[activeIndex];

  return (
    <div ref={containerRef} className="relative">
      <div ref={stickyRef} className="sticky bg-slate-900 overflow-hidden flex flex-col">

        {/* Persistent header */}
        <div className="flex-shrink-0 pt-7 pb-5 px-6 md:px-12 border-b border-white/8">
          <div className="max-w-5xl mx-auto flex items-end justify-between gap-6">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1.5">How it works</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">From audit to #1 in 90 days</h2>
            </div>
            <div className="hidden md:flex items-center gap-0 flex-shrink-0 pb-1">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className="text-xs font-bold tracking-widest transition-all duration-400 px-2"
                    style={{ color: i <= activeIndex ? "#f1f5f9" : "#475569" }}>
                    {s.number}
                  </div>
                  {i < STEPS - 1 && (
                    <div className="w-6 h-px transition-colors duration-500"
                      style={{ backgroundColor: i < activeIndex ? "#f1f5f9" : "#334155" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
          <div style={{ height: "110px" }} className="relative w-full flex items-center justify-center mb-5">
            <div className="absolute text-[8rem] font-black leading-none tracking-tighter select-none"
              style={{
                color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.06)",
                opacity: textVisible ? 1 : 0, transition: "opacity 0.3s ease",
              }}>
              {step.number}
            </div>
            <div className="relative text-[6.5rem] font-black leading-none tracking-tighter text-white"
              style={{
                opacity: textVisible ? 1 : 0,
                transform: textVisible ? "translateY(0)" : "translateY(-12px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}>
              {step.number}
            </div>
          </div>

          <div className="text-center max-w-2xl w-full transition-all duration-300"
            style={{ opacity: textVisible ? 1 : 0, transform: textVisible ? "translateY(0)" : "translateY(10px)" }}>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">{step.title}</h3>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-7">{step.description}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {step.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-slate-400">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex-shrink-0 pb-7 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <div className="h-px bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-150"
                style={{ width: `${overallProgress * 100}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-600">Audit</span>
              <span className="text-xs text-slate-600">Complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
