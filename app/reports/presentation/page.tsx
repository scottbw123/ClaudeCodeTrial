import { GscContent } from "./gsc/GscContent";
import { Ga4Content } from "./ga4/Ga4Content";
import { AiContent } from "./ai/AiContent";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PresentationPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tab = sp.tab === "ga4" ? "ga4" : sp.tab === "ai" ? "ai" : sp.tab === "overview" ? "overview" : "gsc";

  const shared = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "tab") shared.set(k, v);
  }
  const sharedStr = shared.toString();
  const hrefFor = (t: string) => `?tab=${t}${sharedStr ? `&${sharedStr}` : ""}`;
  const overviewHref = hrefFor("overview");
  const gscHref = hrefFor("gsc");
  const ga4Href = hrefFor("ga4");
  const aiHref = hrefFor("ai");

  if (tab === "ga4") return <Ga4Content searchParams={sp} overviewHref={overviewHref} gscHref={gscHref} ga4Href={ga4Href} aiHref={aiHref} />;
  if (tab === "ai") return <AiContent searchParams={sp} overviewHref={overviewHref} gscHref={gscHref} ga4Href={ga4Href} aiHref={aiHref} />;
  return <GscContent searchParams={sp} overviewHref={overviewHref} gscHref={gscHref} ga4Href={ga4Href} aiHref={aiHref} />;
}
