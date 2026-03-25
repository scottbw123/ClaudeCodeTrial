import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RankForge Tool Suite",
  description: "SEO tools and resources by RankForge",
};

const tools = [
  {
    href: "/tools/keyword-extractor",
    icon: "🔍",
    name: "Seed Keyword Extractor",
    description:
      "Enter any URL to extract and rank the best seed keywords for your SEO strategy — powered by AI.",
    badge: "AI Tool",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    href: "/tools/seo-website",
    icon: "🌐",
    name: "SEO Agency Website",
    description:
      "The RankForge agency homepage — a live preview of our brand, services, pricing, and case studies.",
    badge: "Website",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/5 px-6 h-16 flex items-center">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
            R
          </span>
          <span className="font-semibold text-white text-base tracking-tight">
            RankForge
          </span>
          <span className="ml-2 text-zinc-600 text-sm">/ Tool Suite</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="mb-14">
          <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Tool Suite
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Your SEO workspace
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl">
            All your RankForge tools in one place. Pick a tool below to get
            started.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-purple-500/30 rounded-2xl p-8 transition-all duration-200 flex flex-col gap-5"
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">{tool.icon}</span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${tool.badgeColor}`}
                >
                  {tool.badge}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {tool.name}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-purple-400 text-sm font-semibold mt-auto">
                Open tool
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
