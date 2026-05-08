"use client";

import { useEffect, useState } from "react";

type CardProps = {
  index: number;
  offsetX: number;
  yOffset: number;
  depth: number;
  zIndex: number;
  ready: boolean;
  children: React.ReactNode;
};

function Card({ index, offsetX, yOffset, depth, zIndex, ready, children }: CardProps) {
  const [hover, setHover] = useState(false);
  const [lifted, setLifted] = useState(false);
  const stagger = index * 110;
  const baseRotate = "rotateX(-12deg) rotateY(-20deg) rotateZ(0.5deg)";
  const restTransform = `translateX(${offsetX}px) translateY(${yOffset}px) translateZ(${depth}px) ${baseRotate}`;
  const liftedTransform = `translateX(${offsetX}px) translateY(${yOffset - 110}px) translateZ(${depth}px) ${baseRotate}`;
  const initTransform = `translateX(${offsetX}px) translateY(${yOffset + 40}px) translateZ(${depth - 40}px) ${baseRotate} scale(0.94)`;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setLifted((l) => !l)}
      className={
        "absolute w-[420px] h-[280px] rounded-2xl bg-white overflow-hidden cursor-pointer " +
        "shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25),0_10px_25px_-5px_rgba(0,0,0,0.1)] " +
        "border " +
        (lifted || hover ? "border-sky-400/60" : "border-black/10")
      }
      style={{
        top: "50%",
        left: "50%",
        marginTop: "-140px",
        marginLeft: "-210px",
        zIndex,
        transform: ready ? (lifted ? liftedTransform : restTransform) : initTransform,
        opacity: ready ? 1 : 0,
        transition: `transform ${ready ? 600 : 1100}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${ready ? 0 : stagger}ms, opacity 700ms ease-out ${stagger}ms, border-color 200ms ease-out`,
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute top-0 inset-x-0 h-px bg-[repeating-linear-gradient(to_right,rgba(0,0,0,0.25)_0,rgba(0,0,0,0.25)_4px,transparent_4px,transparent_10px)] [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]" />
        <span className="absolute bottom-0 inset-x-0 h-px bg-[repeating-linear-gradient(to_right,rgba(0,0,0,0.25)_0,rgba(0,0,0,0.25)_4px,transparent_4px,transparent_10px)] [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]" />
        <span className="absolute left-0 inset-y-0 w-px bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.25)_0,rgba(0,0,0,0.25)_4px,transparent_4px,transparent_10px)] [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]" />
        <span className="absolute right-0 inset-y-0 w-px bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.25)_0,rgba(0,0,0,0.25)_4px,transparent_4px,transparent_10px)] [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]" />
      </div>
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

function KeywordsCard() {
  const chips = [
    "best running shoes",
    "seo agency london",
    "ecommerce checkout",
    "near me",
    "vegan recipes",
    "ai writing tools",
  ];
  return (
    <div className="h-full w-full p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-black/50 uppercase">
          Keyword research
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
          1,284 ideas
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            className="text-[11px] px-2 py-1 rounded-md bg-black/5 text-black/80 border border-black/5"
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-black/5 bg-black/[0.02] p-2">
          <div className="text-[10px] text-black/50">Volume</div>
          <div className="text-sm font-semibold text-black">12.4k</div>
        </div>
        <div className="rounded-lg border border-black/5 bg-black/[0.02] p-2">
          <div className="text-[10px] text-black/50">Difficulty</div>
          <div className="text-sm font-semibold text-amber-600">42</div>
        </div>
        <div className="rounded-lg border border-black/5 bg-black/[0.02] p-2">
          <div className="text-[10px] text-black/50">Intent</div>
          <div className="text-sm font-semibold text-sky-700">Commercial</div>
        </div>
      </div>
    </div>
  );
}

function RankingsCard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);
  const seeds = [62, 24, 88, 41, 70, 33, 55];
  const heights = seeds.map((s, i) => 28 + ((s + tick * 13 + i * 7) % 70));

  return (
    <div className="h-full w-full p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-black/50 uppercase">
          Rankings
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
          +12 this week
        </span>
      </div>
      <div className="flex-1 flex items-end justify-between gap-2 px-1">
        {heights.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-sky-500 to-sky-300"
            style={{ height: `${h}%`, transition: "height 1200ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-black/70">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        Avg position
        <span className="font-semibold text-black ml-auto">#3.4</span>
      </div>
    </div>
  );
}

function AuditCard() {
  const lines = [
    { tag: "$", text: "seo-audit run example.com" },
    { tag: ">", text: "Crawled 248 pages" },
    { tag: ">", text: "Core Web Vitals: PASS" },
    { tag: ">", text: "Broken links: 3 found" },
    { tag: ">", text: "Missing meta: 12 pages" },
  ];
  return (
    <div className="h-full w-full p-4 flex flex-col gap-3">
      <span className="text-xs font-semibold tracking-wide text-black/50 uppercase">
        Site audit
      </span>
      <div className="flex-1 rounded-lg border border-black/10 bg-[#0b0d10] text-emerald-300 font-mono text-[11px] overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border-b border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <span className="ml-2 text-[10px] text-white/40">audit.sh</span>
        </div>
        <div className="p-3 flex flex-col gap-1">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-sky-300/80 w-3">{l.tag}</span>
              <span className="text-emerald-200/90">{l.text}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <span className="text-sky-300/80 w-3">$</span>
            <span className="inline-block w-1.5 h-3 bg-emerald-300 align-middle animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveSerpCard() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 p-5">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
          Live SERP
        </span>
      </div>
      <div className="text-6xl font-bold tracking-tight text-black tabular-nums">
        #1
      </div>
      <div className="text-xs text-black/50 text-center max-w-[260px]">
        Tracking 482 keywords across Google, Bing &amp; mobile in real time
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1 w-8 rounded-full bg-sky-500/15 overflow-hidden relative"
          >
            <span
              className="absolute inset-y-0 left-0 w-1/2 bg-sky-500 rounded-full animate-[serpPulse_2.4s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function BacklinksCard() {
  const nodes = [
    { x: 20, y: 30, r: 6 },
    { x: 60, y: 18, r: 4 },
    { x: 88, y: 42, r: 5 },
    { x: 45, y: 60, r: 8 },
    { x: 78, y: 78, r: 4 },
    { x: 14, y: 78, r: 5 },
  ];
  const center = { x: 50, y: 48 };
  return (
    <div className="h-full w-full p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-black/50 uppercase">
          Backlink graph
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">
          DR 68
        </span>
      </div>
      <div className="relative flex-1 rounded-lg bg-gradient-to-br from-sky-50 to-violet-50 border border-black/5 overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {nodes.map((n, i) => (
            <line
              key={`l${i}`}
              x1={center.x}
              y1={center.y}
              x2={n.x}
              y2={n.y}
              stroke="rgba(2,132,199,0.35)"
              strokeWidth="0.4"
              strokeDasharray="1.5 1"
            />
          ))}
          {nodes.map((n, i) => (
            <circle
              key={`n${i}`}
              cx={n.x}
              cy={n.y}
              r={n.r / 4}
              fill="rgba(2,132,199,0.7)"
            />
          ))}
          <circle cx={center.x} cy={center.y} r={3} fill="#0284c7" />
        </svg>
      </div>
      <div className="grid grid-cols-3 text-center text-[10px] text-black/60">
        <div>
          <div className="text-sm font-semibold text-black">14.2k</div>
          referring
        </div>
        <div>
          <div className="text-sm font-semibold text-black">+312</div>
          new (30d)
        </div>
        <div>
          <div className="text-sm font-semibold text-emerald-600">98%</div>
          dofollow
        </div>
      </div>
    </div>
  );
}

function Floor() {
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        width: "1100px",
        height: "440px",
        left: "50%",
        top: "55%",
        transform: "translate(-50%, 0) translateZ(-2px) rotateX(-90deg)",
        transformStyle: "preserve-3d",
      }}
    >
      <div className="absolute top-0 -left-40 w-[1600px] h-px bg-[repeating-linear-gradient(to_right,rgba(0,0,0,0.25)_0,rgba(0,0,0,0.25)_5px,transparent_5px,transparent_12px)] [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]" />
      <div className="absolute bottom-0 -left-40 w-[1600px] h-px bg-[repeating-linear-gradient(to_right,rgba(0,0,0,0.25)_0,rgba(0,0,0,0.25)_5px,transparent_5px,transparent_12px)] [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]" />
    </div>
  );
}

export default function SeoCardStack() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full pt-32 pb-16">
      <h2 className="mb-20 text-center text-2xl font-semibold tracking-tight text-foreground select-none">
        Everything your SEO agency runs, in one stack
      </h2>
      <div className="flex w-full items-center justify-center min-h-[600px]">
        <div
          className="relative h-[600px] w-full max-w-6xl mx-auto"
          style={{ perspective: "2400px" }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(-8deg) rotateY(20deg)",
            }}
          >
            <Floor />
            <Card index={0} offsetX={-140} yOffset={0} depth={80} zIndex={60} ready={ready}>
              <KeywordsCard />
            </Card>
            <Card index={1} offsetX={-70} yOffset={-18} depth={60} zIndex={50} ready={ready}>
              <RankingsCard />
            </Card>
            <Card index={2} offsetX={0} yOffset={-36} depth={40} zIndex={40} ready={ready}>
              <AuditCard />
            </Card>
            <Card index={3} offsetX={70} yOffset={-54} depth={20} zIndex={30} ready={ready}>
              <LiveSerpCard />
            </Card>
            <Card index={4} offsetX={140} yOffset={-72} depth={0} zIndex={20} ready={ready}>
              <BacklinksCard />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
