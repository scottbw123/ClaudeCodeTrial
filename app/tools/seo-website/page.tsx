import Link from "next/link";
import ScrollServices from "./components/ScrollServices";
import ScrollProcess from "./components/ScrollProcess";

export default function SEOWebsite() {
  return (
    <div className="min-h-screen bg-[#07080d] text-white font-sans">
      {/* Tool Suite back nav */}
      <div className="bg-[#07080d]/90 border-b border-white/5 px-6 h-10 flex items-center gap-3 text-sm z-50 relative">
        <Link href="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tool Suite
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400 font-semibold">OmniFlow Digital</span>
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07080d]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center">
            <img
              src="https://images.squarespace-cdn.com/content/v1/62ed6ed258fee028614389d2/b303dd3c-b649-439a-9f9a-d46695714210/Omni+Enterprises+Group+2.png?format=1500w"
              alt="OmniFlow Digital"
              className="h-8 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#process" className="hover:text-white transition-colors">Process</a>
            <a href="#results" className="hover:text-white transition-colors">Results</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
          <a
            href="#contact"
            className="bg-[#1d4ed8] hover:bg-[#2563eb] transition-colors text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Get a Free Audit
          </a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="pt-36 pb-28 px-6 relative overflow-hidden bg-[#07080d]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(29,78,216,0.15) 0%, transparent 65%)" }} />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(6,182,212,0.07) 0%, transparent 65%)" }} />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#1d4ed8]/10 border border-[#1d4ed8]/25 text-[#93c5fd] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
              Trusted by 200+ growing brands
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              SEO that turns{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #06b6d4 100%)" }}>
                search into revenue
              </span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              OmniFlow Digital is a performance-driven SEO agency. We combine technical precision,
              authority building, and content strategy to get you to page one — and keep you there.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#contact"
                className="text-white font-semibold px-7 py-3.5 rounded-xl text-base transition-all"
                style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)" }}>
                Get a Free SEO Audit
              </a>
              <a href="#results"
                className="bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white font-semibold px-7 py-3.5 rounded-xl text-base">
                View Case Studies
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            {[
              { value: "3.4×", label: "Avg. traffic growth" },
              { value: "200+", label: "Clients served" },
              { value: "#1", label: "Rankings delivered" },
              { value: "98%", label: "Retention rate" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#07080d] px-6 py-7 text-center">
                <div className="text-3xl font-bold" style={{ color: "#60a5fa" }}>{stat.value}</div>
                <div className="text-zinc-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TRUSTED BY */}
        <section className="py-16 px-6 border-y border-white/5 bg-[#07080d]">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-10">Trusted by teams at</p>
            <div className="flex flex-wrap justify-center gap-10 items-center">
              {["Vercel", "Linear", "Stripe", "Notion", "Loom", "Figma", "Retool"].map((brand) => (
                <span key={brand} className="text-zinc-500 font-semibold text-lg tracking-tight hover:text-zinc-300 transition-colors">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES — scroll section */}
        <section id="services">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="mb-4">
              <p className="text-[#60a5fa] text-sm font-semibold uppercase tracking-widest mb-3">Services</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3">
                Everything your SEO needs
              </h2>
              <p className="text-zinc-400 text-lg">Scroll to explore each service.</p>
            </div>
          </div>
          <ScrollServices />
        </section>

        {/* PROCESS — scroll section */}
        <section id="process">
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-4 bg-[#09090b]">
            <p className="text-zinc-400 text-sm font-semibold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              From audit to #1 in 90 days
            </h2>
          </div>
          <ScrollProcess />
        </section>

        {/* RESULTS */}
        <section id="results" className="py-28 px-6 bg-[#07080d]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[#60a5fa] text-sm font-semibold uppercase tracking-widest mb-3">Case Studies</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">Real results, real companies</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { company: "SaaS Platform", industry: "B2B Software", metric: "+412%", metricLabel: "Organic traffic in 6 months", detail: "Rebuilt site architecture, fixed 1,200+ technical issues, and shipped 80 pieces of pillar content.", accent: "#3b82f6" },
                { company: "DTC Brand", industry: "Ecommerce", metric: "3.8×", metricLabel: "Revenue from organic search", detail: "Category SEO overhaul, 140 editorial backlinks, and product schema implementation.", accent: "#06b6d4" },
                { company: "Law Firm", industry: "Professional Services", metric: "#1", metricLabel: "Local pack in 12 target cities", detail: "Citation cleanup, Google Business optimization, and geo-targeted content strategy.", accent: "#8b5cf6" },
              ].map((cs) => (
                <div key={cs.company}
                  className="border border-white/8 rounded-2xl p-8"
                  style={{ background: `linear-gradient(135deg, ${cs.accent}10 0%, transparent 60%)` }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="font-bold text-white">{cs.company}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">{cs.industry}</div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${cs.accent}20`, color: cs.accent }}>
                      {cs.industry}
                    </span>
                  </div>
                  <div className="text-5xl font-extrabold leading-none mb-1" style={{ color: cs.accent }}>{cs.metric}</div>
                  <div className="text-zinc-300 font-medium text-sm mb-4">{cs.metricLabel}</div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{cs.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-28 px-6" style={{ backgroundColor: "#060709" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[#60a5fa] text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">Don&apos;t take our word for it</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { quote: "OmniFlow took us from page 3 to the top 3 positions for our most competitive keywords in under four months. The ROI has been extraordinary.", name: "Sarah K.", role: "VP of Marketing, Fintech startup" },
                { quote: "Most SEO agencies talk a big game. OmniFlow delivers. They built 60 editorial links in 90 days and our domain authority jumped 18 points.", name: "James R.", role: "Founder, SaaS company" },
                { quote: "The monthly reporting alone is worth the retainer. We finally understand what's driving organic revenue and where every dollar goes.", name: "Priya M.", role: "Head of Growth, Ecommerce brand" },
                { quote: "Our local competitors had a years-long head start. Within six months, we were ranking above them in every city we targeted.", name: "Tom B.", role: "Owner, Multi-location services" },
                { quote: "They audited our site in week one and found a crawl issue that had been bleeding traffic for two years. Fixed in 48 hours.", name: "Lisa C.", role: "CTO, Media company" },
                { quote: "The content team writes like experts in our field. Readers can't tell it's SEO content — because it isn't just SEO content.", name: "Marcus D.", role: "Content Director, B2B platform" },
              ].map((t) => (
                <div key={t.name} className="bg-white/[0.03] border border-white/5 rounded-2xl p-7">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4" style={{ color: "#3b82f6" }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-28 px-6 bg-[#07080d]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[#60a5fa] text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">Transparent, results-based pricing</h2>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">No lock-in contracts. Cancel anytime. Every plan includes a dedicated strategist.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Launch", price: "$2,500", period: "/mo", desc: "For startups and SMBs getting serious about organic.", features: ["Technical SEO audit", "10 content pieces/mo", "5 link placements/mo", "Monthly reporting", "Dedicated strategist"], cta: "Get Started", highlight: false },
                { name: "Scale", price: "$5,500", period: "/mo", desc: "For established companies ready to dominate their niche.", features: ["Everything in Launch", "20 content pieces/mo", "15 link placements/mo", "Weekly reporting", "Competitor gap analysis", "CRO recommendations"], cta: "Most Popular", highlight: true },
                { name: "Enterprise", price: "Custom", period: "", desc: "For large sites, agencies, and multi-brand portfolios.", features: ["Everything in Scale", "Unlimited content", "Unlimited link building", "Dedicated team (3+)", "Custom analytics build", "SLA guaranteed"], cta: "Talk to Sales", highlight: false },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-2xl p-8 flex flex-col ${plan.highlight ? "border-2" : "border border-white/8"}`}
                  style={plan.highlight ? {
                    background: "linear-gradient(135deg, #1d4ed8 0%, #0e7490 100%)",
                    borderColor: "#60a5fa",
                    boxShadow: "0 20px 60px rgba(29,78,216,0.3)"
                  } : { backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <div className="mb-6">
                    <div className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: plan.highlight ? "#bae6fd" : "#60a5fa" }}>{plan.name}</div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                      <span className={`text-sm mb-1 ${plan.highlight ? "text-blue-200" : "text-zinc-500"}`}>{plan.period}</span>
                    </div>
                    <p className={`text-sm ${plan.highlight ? "text-blue-100" : "text-zinc-400"}`}>{plan.desc}</p>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-[#60a5fa]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm ${plan.highlight ? "text-blue-50" : "text-zinc-300"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="#contact"
                    className={`w-full text-center font-semibold py-3 rounded-xl text-sm transition-colors ${plan.highlight ? "bg-white text-blue-700 hover:bg-blue-50" : "text-white hover:opacity-90"}`}
                    style={!plan.highlight ? { background: "linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)" } : {}}>
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="py-28 px-6 bg-[#07080d]">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl px-10 py-16 text-center overflow-hidden border border-white/8"
              style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.25) 0%, rgba(8,145,178,0.15) 100%)" }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, rgba(29,78,216,0.2) 0%, transparent 70%)" }} />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Ready to rank?</h2>
                <p className="text-zinc-300 text-lg mb-10 max-w-xl mx-auto">
                  Book a free 30-minute strategy call. We&apos;ll audit your site, review your competitors, and show you exactly where the opportunities are.
                </p>
                <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input type="email" placeholder="Enter your email"
                    className="flex-1 bg-white/10 border border-white/10 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ "--tw-ring-color": "#3b82f6" } as React.CSSProperties} />
                  <button type="submit"
                    className="text-white font-semibold px-6 py-3 rounded-xl text-sm whitespace-nowrap transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)" }}>
                    Get Free Audit
                  </button>
                </form>
                <p className="text-zinc-500 text-xs mt-4">No spam. No commitments. Just clarity.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#07080d]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img
            src="https://images.squarespace-cdn.com/content/v1/62ed6ed258fee028614389d2/b303dd3c-b649-439a-9f9a-d46695714210/Omni+Enterprises+Group+2.png?format=1500w"
            alt="OmniFlow Digital"
            className="h-6 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1) opacity(0.6)" }}
          />
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#process" className="hover:text-white transition-colors">Process</a>
            <a href="#results" className="hover:text-white transition-colors">Results</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
          <p className="text-zinc-600 text-sm">© 2026 OmniFlow Digital. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
