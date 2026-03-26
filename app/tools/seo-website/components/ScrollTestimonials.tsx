"use client";

import { useEffect, useRef, useState } from "react";
import { getNavHeight } from "./navHeight";

const ITEMS = 6;
const VH_PER_ITEM = 1.0;

// Fixed card width/height — never changes so text never reflows
const CARD_W = 310;
const CARD_H = 210;

const testimonials = [
  {
    quote: "OmniFlow took us from page 3 to the top 3 positions for our most competitive keywords in under four months. The ROI has been extraordinary.",
    name: "Sarah K.",
    role: "VP of Marketing, Fintech",
  },
  {
    quote: "Most SEO agencies talk a big game. OmniFlow delivers. They built 60 editorial links in 90 days and our domain authority jumped 18 points.",
    name: "James R.",
    role: "Founder, SaaS company",
  },
  {
    quote: "The monthly reporting alone is worth the retainer. We finally understand what's driving organic revenue and where every dollar goes.",
    name: "Priya M.",
    role: "Head of Growth, Ecommerce",
  },
  {
    quote: "Our local competitors had a years-long head start. Within six months, we were ranking above them in every city we targeted.",
    name: "Tom B.",
    role: "Owner, Multi-location",
  },
  {
    quote: "They audited our site in week one and found a crawl issue that had been bleeding traffic for two years. Fixed in 48 hours.",
    name: "Lisa C.",
    role: "CTO, Media company",
  },
  {
    quote: "The content team writes like experts in our field. Readers can't tell it's SEO content — because it isn't just SEO content.",
    name: "Marcus D.",
    role: "Content Director, B2B",
  },
];

// Scattered positions as % of the cards area (excluding header)
// These are the center point of each card as % of viewport
const POSITIONS = [
  { cx: 18,  cy: 22 },
  { cx: 72,  cy: 16 },
  { cx: 80,  cy: 55 },
  { cx: 10,  cy: 62 },
  { cx: 38,  cy: 78 },
  { cx: 62,  cy: 74 },
];

export default function ScrollTestimonials() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  // cardAreaH: height of the area below the header where cards float
  const [cardAreaH, setCardAreaH] = useState(0);

  useEffect(() => {
    const setHeights = () => {
      const navH = getNavHeight();
      const avail = window.innerHeight - navH;
      if (containerRef.current) containerRef.current.style.height = `${avail * ITEMS * VH_PER_ITEM}px`;
      if (stickyRef.current) {
        stickyRef.current.style.top = `${navH}px`;
        stickyRef.current.style.height = `${avail}px`;
      }
      // card area = avail minus the internal section header (~80px)
      setCardAreaH(avail - 80);
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
      if (scrolled < 0) { setActiveIndex(-1); return; }
      const pct = Math.max(0, Math.min(1, scrolled / total));
      const raw = pct * ITEMS;
      const index = Math.min(ITEMS - 1, Math.floor(raw));
      setActiveIndex(index);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <style>{`
        @keyframes tf0{0%,100%{transform:translate(0px,0px) rotate(-0.7deg)}33%{transform:translate(5px,-11px) rotate(0.4deg)}66%{transform:translate(-3px,-5px) rotate(-1deg)}}
        @keyframes tf1{0%,100%{transform:translate(0px,0px) rotate(0.6deg)}40%{transform:translate(-5px,-9px) rotate(-0.5deg)}75%{transform:translate(4px,-4px) rotate(0.9deg)}}
        @keyframes tf2{0%,100%{transform:translate(0px,0px) rotate(1deg)}50%{transform:translate(6px,-13px) rotate(-0.5deg)}}
        @keyframes tf3{0%,100%{transform:translate(0px,0px) rotate(-0.9deg)}45%{transform:translate(-5px,-8px) rotate(0.7deg)}80%{transform:translate(3px,-4px) rotate(-0.3deg)}}
        @keyframes tf4{0%,100%{transform:translate(0px,0px) rotate(0.7deg)}35%{transform:translate(4px,-10px) rotate(-0.8deg)}65%{transform:translate(-2px,-6px) rotate(0.4deg)}}
        @keyframes tf5{0%,100%{transform:translate(0px,0px) rotate(-0.5deg)}55%{transform:translate(-4px,-12px) rotate(1deg)}}
        .tf-idle-0{animation:tf0 6.2s ease-in-out infinite;}
        .tf-idle-1{animation:tf1 7.4s ease-in-out infinite;animation-delay:1.1s;}
        .tf-idle-2{animation:tf2 5.8s ease-in-out infinite;animation-delay:0.6s;}
        .tf-idle-3{animation:tf3 6.9s ease-in-out infinite;animation-delay:2.0s;}
        .tf-idle-4{animation:tf4 7.1s ease-in-out infinite;animation-delay:0.3s;}
        .tf-idle-5{animation:tf5 6.5s ease-in-out infinite;animation-delay:1.5s;}
      `}</style>

      <div ref={stickyRef} className="sticky overflow-hidden" style={{ backgroundColor: "#060709" }}>
        {/* Ambient */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(29,78,216,0.05) 0%, transparent 70%)" }} />

        {/* Header */}
        <div className="relative z-20 pt-7 pb-4 px-6 text-center flex-shrink-0 border-b border-white/5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="text-left">
              <p className="text-[#60a5fa] text-xs font-semibold uppercase tracking-widest mb-1">Testimonials</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">Don&apos;t take our word for it</h2>
            </div>
            {/* Progress dots */}
            <div className="hidden md:flex items-center gap-2">
              {testimonials.map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-700"
                  style={{
                    width: i === activeIndex ? "18px" : "5px",
                    height: "5px",
                    backgroundColor: i === activeIndex ? "#3b82f6"
                      : i < activeIndex ? "rgba(59,130,246,0.25)"
                      : "rgba(255,255,255,0.08)",
                  }} />
              ))}
            </div>
          </div>
        </div>

        {/* Cards area */}
        {cardAreaH > 0 && (
          <div className="absolute left-0 right-0" style={{ top: "80px", height: cardAreaH }}>
            {testimonials.map((t, i) => {
              const isActive = i === activeIndex;
              const wasPast = i < activeIndex;
              const pos = POSITIONS[i];

              // Convert % positions to actual pixel offsets from top-left
              // accounting for card size so the card is centered on that point
              const leftPx = `calc(${pos.cx}% - ${CARD_W / 2}px)`;
              const topPx = `calc(${pos.cy}% - ${CARD_H / 2}px)`;

              // Active: centered in card area
              const activeLPx = `calc(50% - ${CARD_W / 2}px)`;
              const activeTPx = `calc(45% - ${CARD_H / 2}px)`;

              return (
                <div
                  key={i}
                  // Apply float animation only when not active (prevents fighting with transition)
                  className={!isActive ? `tf-idle-${i}` : ""}
                  style={{
                    position: "absolute",
                    width: CARD_W,
                    height: CARD_H,
                    left: isActive ? activeLPx : leftPx,
                    top: isActive ? activeTPx : topPx,
                    zIndex: isActive ? 20 : wasPast ? 2 : 4,
                    opacity: activeIndex < 0 ? 0.5
                      : isActive ? 1
                      : wasPast ? 0.08
                      : 0.18,
                    // Slow, fluid transition — no spring, pure ease
                    transition: "left 1.3s cubic-bezier(0.4,0,0.2,1), top 1.3s cubic-bezier(0.4,0,0.2,1), opacity 1.0s ease, box-shadow 1.0s ease",
                    filter: isActive ? "none" : "blur(0.5px)",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: CARD_W,
                      height: CARD_H,
                      backgroundColor: isActive ? "#0d1321" : "#0a0c12",
                      borderRadius: "16px",
                      border: isActive ? "1px solid rgba(59,130,246,0.28)" : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: isActive ? "0 28px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.15)" : "none",
                      padding: "20px",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      // No transform that changes box geometry — only position/opacity transitions above
                      transition: "background-color 0.8s ease, border-color 0.8s ease, box-shadow 0.8s ease",
                    }}
                  >
                    {/* Stars */}
                    <div style={{ display: "flex", gap: "3px", marginBottom: "10px" }}>
                      {[...Array(5)].map((_, si) => (
                        <svg key={si} width="12" height="12" fill="#3b82f6" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Quote — fixed font size so wrapping never changes */}
                    <p style={{ color: "#d4d4d8", fontSize: "0.8rem", lineHeight: "1.55", flex: 1, overflow: "hidden" }}>
                      &ldquo;{t.quote}&rdquo;
                    </p>

                    {/* Author */}
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ color: "#ffffff", fontSize: "0.8rem", fontWeight: 600 }}>{t.name}</div>
                      <div style={{ color: "#52525b", fontSize: "0.7rem", marginTop: "2px" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scroll hint */}
        {activeIndex < 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 text-xs z-20 animate-pulse">
            <span>Scroll to read reviews</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
