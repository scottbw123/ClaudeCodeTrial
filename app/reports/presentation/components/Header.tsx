import Link from "next/link";
import { formatHumanDate } from "@/lib/date-utils";

export function PresentationHeader({
  title,
  startDate,
  endDate,
  activeTab,
  queryString,
}: {
  title: string;
  startDate: string;
  endDate: string;
  activeTab: "gsc" | "ga4";
  queryString: string;
}) {
  const qs = queryString ? `?${queryString}` : "";

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
          <nav className="inline-flex items-center gap-1 bg-neutral-900 rounded-md p-1">
            <Link
              href={`/reports/presentation/gsc${qs}`}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === "gsc" ? "bg-white text-black" : "text-gray-300 hover:text-white"
              }`}
            >
              GSC
            </Link>
            <Link
              href={`/reports/presentation/ga4${qs}`}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === "ga4" ? "bg-white text-black" : "text-gray-300 hover:text-white"
              }`}
            >
              GA4
            </Link>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-md bg-neutral-800 px-3 py-1.5 text-sm">
            <span>
              {formatHumanDate(startDate)} – {formatHumanDate(endDate)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
