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
      <div className="max-w-[1400px] mx-auto px-6 py-4 grid grid-cols-3 items-center">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/omniflow-logo.png"
            alt="OMNIFLOW"
            className="h-7 w-auto"
            style={{ filter: "invert(1) brightness(2)" }}
          />
        </div>
        <h1 className="text-center text-2xl font-bold">{title}</h1>
        <div className="justify-self-end inline-flex items-center gap-3">
          <nav className="inline-flex items-center gap-1 bg-black border border-neutral-800 p-1">
            <TabLink href={overviewHref} label="Overview" active={activeTab === "overview"} />
            <TabLink href={gscHref} label="GSC" active={activeTab === "gsc"} />
            <TabLink href={ga4Href} label="GA4" active={activeTab === "ga4"} />
            <TabLink href={aiHref} label="AI" active={activeTab === "ai"} />
          </nav>
          <div className="inline-flex items-center gap-2 bg-black border border-neutral-800 px-3 py-1.5 text-sm">
            <span>
              {formatHumanDate(startDate)} – {formatHumanDate(endDate)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
