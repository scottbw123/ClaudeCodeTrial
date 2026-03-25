"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Deep-Dive Audit",
    description:
      "We analyze your site, competitors, and keyword landscape to uncover every growth opportunity. No stone left unturned.",
    detail: "Technical crawl · Competitor gap analysis · Keyword mapping · Backlink profile review",
  },
  {
    number: "02",
    title: "Custom Roadmap",
    description:
      "You receive a prioritized 90-day plan with clear milestones, deliverables, and projected outcomes tied to real revenue.",
    detail: "90-day sprint plan · KPI framework · Content calendar · Link building pipeline",
  },
  {
    number: "03",
    title: "Execution Sprint",
    description:
      "Our team builds links, ships content, and fixes technical issues at a pace that compounds month over month.",
    detail: "On-page optimization · Editorial outreach · Content production · Technical fixes",
  },
  {
    number: "04",
    title: "Report & Iterate",
    description:
      "Monthly reports track every ranking, click, and conversion. We refine the strategy based on data, not guesswork.",
    detail: "Rank tracking · Traffic attribution · Conversion analysis · Strategy refinement",
  },
];

export default function ScrollProcess() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemProgress, setItemProgress] = useState(0);
  const [textVisible, setTextVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = Math.max(0, Math.min(1, scrolled / total));
      const rawIndex = pct * steps.length;
      const index = Math.min(steps.length - 1, Math.floor(rawIndex));
      const within = rawIndex - index;

      setActiveIndex(index);
      setItemProgress(within);

      // Fade text out near transition, back in after
      const fadeOut = within > 0.75 && index < steps.length - 1;
      setTextVisible(!fadeOut);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const current = steps[activeIndex];
  const overallProgress = (activeIndex + itemProgress) / steps.length;

  return (
    <div
      ref={containerRef}
      style={{ height: `${steps.length * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 h-screen bg-[#09090b] overflow-hidden flex flex-col">
        {/* Top horizontal progress track */}
        <div className="relative flex-shrink-0 pt-16 pb-8 px-6 max-w-5xl mx-auto w-full">
          {/* Step markers */}
          <div className="flex items-center gap-0 w-full">
            {steps.map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="text-xs font-bold tracking-widest transition-colors duration-300"
                  style={{ color: i <= activeIndex ? "#e2e8f0" : "#3f3f46" }}
                >
                  {step.number}
                </div>
                <div className="w-full flex items-center">
                  {i > 0 && (
                    <div
                      className="flex-1 h-px transition-colors duration-500"
                      style={{
                        backgroundColor: i <= activeIndex ? "#e2e8f0" : "#27272a",
                      }}
                    />
                  )}
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-500 mx-auto"
                    style={{
                      backgroundColor: i < activeIndex ? "#e2e8f0" : i === activeIndex ? "#ffffff" : "#27272a",
                      transform: i === activeIndex ? "scale(1.4)" : "scale(1)",
                      boxShadow: i === activeIndex ? "0 0 0 3px rgba(255,255,255,0.15)" : "none",
                    }}
                  />
                  {i < steps.length - 1 && (
                    <div
                      className="flex-1 h-px transition-colors duration-500"
                      style={{
                        backgroundColor: i < activeIndex ? "#e2e8f0" : "#27272a",
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full">
          {/* Giant number */}
          <div className="relative overflow-hidden h-48 flex items-center justify-center mb-8 w-full">
            <div
              className="text-[12rem] font-black leading-none tracking-tighter select-none transition-all duration-400"
              style={{
                color: "transparent",
                WebkitTextStroke: "1px rgba(255,255,255,0.06)",
                opacity: textVisible ? 1 : 0,
                transform: textVisible ? "translateY(0)" : "translateY(-20px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              {current.number}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center text-[8rem] font-black leading-none tracking-tighter"
              style={{
                color: "rgba(255,255,255,0.9)",
                opacity: textVisible ? 1 : 0,
                transform: textVisible ? "translateY(0)" : "translateY(-16px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              {current.number}
            </div>
          </div>

          {/* Text content */}
          <div
            className="text-center max-w-2xl transition-all duration-300"
            style={{
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? "translateY(0)" : "translateY(12px)",
            }}
          >
            <h3 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
              {current.title}
            </h3>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              {current.description}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {current.detail.split(" · ").map((item) => (
                <span
                  key={item}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-zinc-400"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="flex-shrink-0 pb-8 px-6 max-w-5xl mx-auto w-full">
          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${overallProgress * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-zinc-600">Start</span>
            <span className="text-xs text-zinc-600">{current.title}</span>
            <span className="text-xs text-zinc-600">Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
