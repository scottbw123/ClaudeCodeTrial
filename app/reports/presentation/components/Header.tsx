import { formatHumanDate } from "@/lib/date-utils";
import { TabLink } from "./TabLink";

export type PresentationTab = "gsc" | "ga4" | "ai" | "overview";

export function PresentationHeader({
  title,
  startDate,
  endDate,
  activeTab,
  overviewHref,
  gscHref,
  ga4Href,
  aiHref,
}: {
  title: string;
  startDate: string;
  endDate: string;
  activeTab: PresentationTab;
  overviewHref: string;
  gscHref: string;
  ga4Href: string;
  aiHref: string;
}) {
  return (
    <header className="bg-black text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-4 grid grid-cols-2 gap-y-3 items-center">
        {/* Top-left: logo */}
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/omniflow-logo.png"
            alt="OMNIFLOW"
            className="h-7 w-auto"
            style={{ filter: "invert(1) brightness(2)" }}
          />
        </div>

        {/* Top-right: page title */}
        <h1 className="text-right text-2xl font-bold m-0">{title}</h1>

        {/* Bottom-left: tab nav */}
        <nav className="inline-flex items-center gap-1 bg-black border border-neutral-800 p-1 justify-self-start">
          <TabLink href={overviewHref} label="Overview" active={activeTab === "overview"} />
          <TabLink href={gscHref} label="GSC" active={activeTab === "gsc"} />
          <TabLink href={ga4Href} label="GA4" active={activeTab === "ga4"} />
          <TabLink href={aiHref} label="AI" active={activeTab === "ai"} />
        </nav>

        {/* Bottom-right: date range */}
        <div className="justify-self-end inline-flex items-center gap-2 bg-black border border-neutral-800 px-3 py-1.5 text-sm">
          <span className="tabular-nums">
            {formatHumanDate(startDate)} – {formatHumanDate(endDate)}
          </span>
        </div>
      </div>
    </header>
  );
}
