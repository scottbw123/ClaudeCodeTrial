import Link from "next/link";

export default function SEOWebsite() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      {/* Tool Suite back nav */}
      <div className="bg-[#09090b]/90 border-b border-white/5 px-6 h-11 flex items-center gap-3 text-sm">
        <Link href="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tool Suite
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400 font-semibold">SEO Agency Website</span>
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-purple-600 flex items-center justify-center text-white font-bold text-sm">R</span>
            <span className="font-semibold text-white text-base tracking-tight">RankForge</span>
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
            className="bg-purple-600 hover:bg-purple-500 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Get a Free Audit
          </a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="pt-36 pb-28 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-700/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Trusted by 200+ growing brands
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              SEO that turns{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300">
                search into revenue
              </span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              RankForge is a performance-driven SEO agency. We combine technical
              precision, authority building, and content strategy to get you to
              page one — and keep you there.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contact"
                className="bg-purple-600 hover:bg-purple-500 transition-colors text-white font-semibold px-7 py-3.5 rounded-xl text-base"
              >
                Get a Free SEO Audit
              </a>
              <a
                href="#results"
                className="bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white font-semibold px-7 py-3.5 rounded-xl text-base"
              >
                View Case Studies
              </a>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {[
              { value: "3.4×", label: "Avg. traffic growth" },
              { value: "200+", label: "Clients served" },
              { value: "#1", label: "Rankings delivered" },
              { value: "98%", label: "Retention rate" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#09090b] px-6 py-7 text-center">
                <div className="text-3xl font-bold text-purple-400">{stat.value}</div>
                <div className="text-zinc-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TRUSTED BY */}
        <section className="py-16 px-6 border-y border-white/5">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-zinc-500 text-sm uppercase tracking-widest mb-10">Trusted by teams at</p>
            <div className="flex flex-wrap justify-center gap-10 items-center">
              {["Vercel", "Linear", "Stripe", "Notion", "Loom", "Figma", "Retool"].map((brand) => (
                <span key={brand} className="text-zinc-500 font-semibold text-lg tracking-tight hover:text-zinc-300 transition-colors">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 max-w-2xl">
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Services</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
                Everything your SEO needs, nothing it doesn&apos;t
              </h2>
              <p className="text-zinc-400 text-lg">
                We offer a full suite of SEO services, tailored to your industry, goals, and budget.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: "⚡", title: "Technical SEO", desc: "Core Web Vitals, crawlability, indexation, site architecture, and speed optimization — the foundation every site needs." },
                { icon: "🔗", title: "Link Building", desc: "White-hat authority building through digital PR, editorial placements, and strategic partnerships that move rankings." },
                { icon: "✍️", title: "Content Strategy", desc: "Keyword-mapped content plans, topical authority clusters, and high-intent copy that converts organic visitors." },
                { icon: "📍", title: "Local SEO", desc: "Dominate Google Maps and local pack results. Perfect for multi-location businesses and service-area companies." },
                { icon: "🛒", title: "Ecommerce SEO", desc: "Category page optimization, product schema, faceted navigation, and merchant feed strategies for DTC brands." },
                { icon: "📊", title: "SEO Analytics", desc: "Custom dashboards, rank tracking, attribution reporting, and monthly strategy reviews tied to revenue impact." },
              ].map((service) => (
                <div key={service.title} className="group bg-white/[0.03] hover:bg-purple-600/10 border border-white/5 hover:border-purple-500/30 rounded-2xl p-7 transition-all duration-200">
                  <div className="text-2xl mb-4">{service.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section id="process" className="py-28 px-6 bg-white/[0.02]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">How it works</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">From audit to #1 in 90 days</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Deep-Dive Audit", desc: "We analyze your site, competitors, and keyword landscape to uncover every growth opportunity." },
                { step: "02", title: "Custom Roadmap", desc: "You receive a prioritized 90-day plan with clear milestones, deliverables, and projected outcomes." },
                { step: "03", title: "Execution Sprint", desc: "Our team builds links, ships content, and fixes technical issues at a pace that compounds." },
                { step: "04", title: "Report & Iterate", desc: "Monthly reports track every ranking, click, and conversion. We refine based on data, not guesswork." },
              ].map((item) => (
                <div key={item.step}>
                  <div className="text-5xl font-extrabold text-purple-800/40 mb-4 leading-none">{item.step}</div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section id="results" className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Case Studies</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">Real results, real companies</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { company: "SaaS Platform", industry: "B2B Software", metric: "+412%", metricLabel: "Organic traffic in 6 months", detail: "Rebuilt site architecture, fixed 1,200+ technical issues, and shipped 80 pieces of pillar content.", color: "from-purple-900/40 to-purple-800/10" },
                { company: "DTC Brand", industry: "Ecommerce", metric: "3.8×", metricLabel: "Revenue from organic search", detail: "Category SEO overhaul, 140 editorial backlinks, and product schema implementation.", color: "from-violet-900/40 to-violet-800/10" },
                { company: "Law Firm", industry: "Professional Services", metric: "#1", metricLabel: "Local pack in 12 target cities", detail: "Citation cleanup, Google Business optimization, and geo-targeted content strategy.", color: "from-purple-900/40 to-indigo-800/10" },
              ].map((cs) => (
                <div key={cs.company} className={`bg-gradient-to-b ${cs.color} border border-white/8 rounded-2xl p-8`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="font-bold text-white">{cs.company}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">{cs.industry}</div>
                    </div>
                    <span className="bg-purple-600/20 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full">{cs.industry}</span>
                  </div>
                  <div className="text-5xl font-extrabold text-purple-300 leading-none mb-1">{cs.metric}</div>
                  <div className="text-zinc-300 font-medium text-sm mb-4">{cs.metricLabel}</div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{cs.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-28 px-6 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">Don&apos;t take our word for it</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { quote: "RankForge took us from page 3 to the top 3 positions for our most competitive keywords in under four months. The ROI has been extraordinary.", name: "Sarah K.", role: "VP of Marketing, Fintech startup" },
                { quote: "Most SEO agencies talk a big game. RankForge delivers. They built 60 editorial links in 90 days and our domain authority jumped 18 points.", name: "James R.", role: "Founder, SaaS company" },
                { quote: "The monthly reporting alone is worth the retainer. We finally understand what's driving organic revenue and where every dollar goes.", name: "Priya M.", role: "Head of Growth, Ecommerce brand" },
                { quote: "Our local competitors had a years-long head start. Within six months, we were ranking above them in every city we targeted.", name: "Tom B.", role: "Owner, Multi-location services" },
                { quote: "They audited our site in week one and found a crawl issue that had been bleeding traffic for two years. Fixed in 48 hours.", name: "Lisa C.", role: "CTO, Media company" },
                { quote: "The content team writes like experts in our field. Readers can't tell it's SEO content — because it isn't just SEO content.", name: "Marcus D.", role: "Content Director, B2B platform" },
              ].map((t) => (
                <div key={t.name} className="bg-white/[0.03] border border-white/5 rounded-2xl p-7">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
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
        <section id="pricing" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">Transparent, results-based pricing</h2>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">No lock-in contracts. Cancel anytime. Every plan includes a dedicated strategist.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Launch", price: "$2,500", period: "/mo", desc: "For startups and SMBs getting serious about organic.", features: ["Technical SEO audit", "10 content pieces/mo", "5 link placements/mo", "Monthly reporting", "Dedicated strategist"], cta: "Get Started", highlight: false },
                { name: "Scale", price: "$5,500", period: "/mo", desc: "For established companies ready to dominate their niche.", features: ["Everything in Launch", "20 content pieces/mo", "15 link placements/mo", "Weekly reporting", "Competitor gap analysis", "CRO recommendations"], cta: "Most Popular", highlight: true },
                { name: "Enterprise", price: "Custom", period: "", desc: "For large sites, agencies, and multi-brand portfolios.", features: ["Everything in Scale", "Unlimited content", "Unlimited link building", "Dedicated team (3+)", "Custom analytics build", "SLA guaranteed"], cta: "Talk to Sales", highlight: false },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-2xl p-8 flex flex-col ${plan.highlight ? "bg-purple-600 border-2 border-purple-400 shadow-xl shadow-purple-900/40" : "bg-white/[0.03] border border-white/8"}`}>
                  <div className="mb-6">
                    <div className="text-sm font-semibold uppercase tracking-widest mb-2 text-purple-200">{plan.name}</div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                      <span className={`text-sm mb-1 ${plan.highlight ? "text-purple-200" : "text-zinc-500"}`}>{plan.period}</span>
                    </div>
                    <p className={`text-sm ${plan.highlight ? "text-purple-100" : "text-zinc-400"}`}>{plan.desc}</p>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-purple-200" : "text-purple-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm ${plan.highlight ? "text-purple-50" : "text-zinc-300"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="#contact" className={`w-full text-center font-semibold py-3 rounded-xl text-sm transition-colors ${plan.highlight ? "bg-white text-purple-700 hover:bg-purple-50" : "bg-purple-600 hover:bg-purple-500 text-white"}`}>
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-purple-900/60 to-violet-900/40 border border-purple-500/20 rounded-3xl px-10 py-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/20 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Ready to rank?</h2>
                <p className="text-zinc-300 text-lg mb-10 max-w-xl mx-auto">
                  Book a free 30-minute strategy call. We&apos;ll audit your site, review your competitors, and show you exactly where the opportunities are.
                </p>
                <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input type="email" placeholder="Enter your email" className="flex-1 bg-white/10 border border-white/10 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 transition-colors text-white font-semibold px-6 py-3 rounded-xl text-sm whitespace-nowrap">
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
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-xs">R</span>
            <span className="font-semibold text-white text-sm">RankForge</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#process" className="hover:text-white transition-colors">Process</a>
            <a href="#results" className="hover:text-white transition-colors">Results</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
          <p className="text-zinc-600 text-sm">© 2026 RankForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
