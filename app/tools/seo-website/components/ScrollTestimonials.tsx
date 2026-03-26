"use client";

import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    quote: "OmniFlow took us from page 3 to the top 3 positions for our most competitive keywords in under four months. The ROI has been extraordinary.",
    name: "Sarah K.",
    role: "VP of Marketing, Fintech",
    stars: 5,
  },
  {
    quote: "Most SEO agencies talk a big game. OmniFlow delivers. They built 60 editorial links in 90 days and our domain authority jumped 18 points.",
    name: "James R.",
    role: "Founder, SaaS company",
    stars: 5,
  },
  {
    quote: "The monthly reporting alone is worth the retainer. We finally understand what's driving organic revenue and where every dollar goes.",
    name: "Priya M.",
    role: "Head of Growth, Ecommerce",
    stars: 5,
  },
  {
    quote: "Our local competitors had a years-long head start. Within six months, we were ranking above them in every city we targeted.",
    name: "Tom B.",
    role: "Owner, Multi-location",
    stars: 5,
  },
  {
    quote: "They audited our site in week one and found a crawl issue that had been bleeding traffic for two years. Fixed in 48 hours.",
    name: "Lisa C.",
    role: "CTO, Media company",
    stars: 5,
  },
  {
    quote: "The content team writes like experts in our field. Readers can't tell it's SEO content — because it isn't just SEO content.",
    name: "Marcus D.",
    role: "Content Director, B2B",
    stars: 5,
  },
];

// Scattered base positions (left%, top% of the cards area)
const POSITIONS = [
  { left: "4%",  top: "8%"  },
  { left: "58%", top: "5%"  },
  { left: "72%", top: "42%" },
  { left: "2%",  top: "55%" },
  { left: "22%", top: "68%" },
  { left: "54%", top: "66%" },
];

// Float animation durations and delays for organic feel
const FLOAT_PARAMS = [
  { dur: 6.2, delay: 0,    tx: 6,  ty: 12, rot: 1.2  },
  { dur: 7.4, delay: 1.1,  tx: -5, ty: 10, rot: -0.8 },
  { dur: 5.8, delay: 0.6,  tx: 7,  ty: 14, rot: 1.5  },
  { dur: 6.9, delay: 2.0,  tx: -6, ty: 9,  rot: -1.0 },
  { dur: 7.1, delay: 0.3,  tx: 5,  ty: 11, rot: 0.9  },
  { dur: 6.5, delay: 1.5,  tx: -4, ty: 13, rot: -1.3 },
];

export default function ScrollTestimonials() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const pct = Math.max(0, Math.min(1, scrolled / total));

      if (scrolled < 0) {
        setActiveIndex(-1);
        return;
      }

      const rawIndex = pct * testimonials.length;
      const index = Math.min(testimonials.length - 1, Math.floor(rawIndex));
      setActiveIndex(index);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} style={{ height: `${testimonials.length * 80}vh` }} className="relative">
      {/* Keyframe CSS */}
      <style>{`
        @keyframes tf-0{0%,100%{transform:translate(0,0) rotate(-0.8deg)}33%{transform:translate(6px,-12px) rotate(0.4deg)}66%{transform:translate(-3px,-6px) rotate(-1.2deg)}}
        @keyframes tf-1{0%,100%{transform:translate(0,0) rotate(0.6deg)}40%{transform:translate(-5px,-10px) rotate(-0.5deg)}70%{transform:translate(4px,-4px) rotate(1deg)}}
        @keyframes tf-2{0%,100%{transform:translate(0,0) rotate(1.2deg)}50%{transform:translate(7px,-14px) rotate(-0.6deg)}}
        @keyframes tf-3{0%,100%{transform:translate(0,0) rotate(-1deg)}45%{transform:translate(-6px,-9px) rotate(0.8deg)}80%{transform:translate(3px,-5px) rotate(-0.4deg)}}
        @keyframes tf-4{0%,100%{transform:translate(0,0) rotate(0.8deg)}35%{transform:translate(5px,-11px) rotate(-1deg)}65%{transform:translate(-2px,-7px) rotate(0.5deg)}}
        @keyframes tf-5{0%,100%{transform:translate(0,0) rotate(-0.6deg)}55%{transform:translate(-4px,-13px) rotate(1.1deg)}}
        .tf-float-0{animation:tf-0 6.2s ease-in-out infinite;}
        .tf-float-1{animation:tf-1 7.4s ease-in-out infinite;animation-delay:1.1s;}
        .tf-float-2{animation:tf-2 5.8s ease-in-out infinite;animation-delay:0.6s;}
        .tf-float-3{animation:tf-3 6.9s ease-in-out infinite;animation-delay:2.0s;}
        .tf-float-4{animation:tf-4 7.1s ease-in-out infinite;animation-delay:0.3s;}
        .tf-float-5{animation:tf-5 6.5s ease-in-out infinite;animation-delay:1.5s;}
      `}</style>

      <div className="sticky top-0 h-screen overflow-hidden" style={{ backgroundColor: "#060709" }}>
        {/* Subtle background gradient */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(29,78,216,0.06) 0%, transparent 65%)" }} />

        {/* Section header */}
        <div className="relative z-20 pt-8 pb-4 px-6 text-center">
          <p className="text-[#60a5fa] text-xs font-semibold uppercase tracking-widest mb-2">Testimonials</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Don&apos;t take our word for it
          </h2>
        </div>

        {/* Cards area */}
        <div className="absolute inset-0 top-24">
          {testimonials.map((t, i) => {
            const isActive = i === activeIndex;
            const wasPast = i < activeIndex;
            const pos = POSITIONS[i];

            return (
              <div
                key={i}
                className={!isActive ? `tf-float-${i}` : ""}
                style={{
                  position: "absolute",
                  left: isActive ? "50%" : pos.left,
                  top: isActive ? "42%" : pos.top,
                  transform: isActive
                    ? "translate(-50%, -50%) scale(1.12)"
                    : `scale(${wasPast ? 0.78 : 0.82})`,
                  zIndex: isActive ? 20 : 3,
                  opacity: activeIndex === -1 ? 0.55
                    : isActive ? 1
                    : wasPast ? 0.1
                    : 0.22,
                  width: isActive ? "min(420px, 88vw)" : "240px",
                  transition: "all 0.75s cubic-bezier(0.34, 1.2, 0.64, 1)",
                  filter: isActive ? "none" : wasPast ? "blur(1px)" : "blur(0.5px)",
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                <div
                  className="rounded-2xl p-5 border"
                  style={{
                    backgroundColor: isActive ? "#0d1321" : "#0a0c12",
                    borderColor: isActive ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)",
                    boxShadow: isActive ? "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.2)" : "none",
                  }}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(t.stars)].map((_, si) => (
                      <svg key={si} className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-zinc-200 leading-relaxed mb-4"
                    style={{ fontSize: isActive ? "0.9rem" : "0.75rem" }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  <div>
                    <div className="font-semibold text-white" style={{ fontSize: isActive ? "0.875rem" : "0.75rem" }}>
                      {t.name}
                    </div>
                    <div className="text-zinc-500" style={{ fontSize: isActive ? "0.75rem" : "0.65rem", marginTop: "2px" }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll hint when no active */}
        {activeIndex === -1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 text-xs animate-pulse z-20">
            <span>Scroll to read reviews</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* Progress dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {testimonials.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-400"
              style={{
                width: i === activeIndex ? "18px" : "5px",
                height: "5px",
                backgroundColor: i === activeIndex ? "#3b82f6" : i < activeIndex ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
