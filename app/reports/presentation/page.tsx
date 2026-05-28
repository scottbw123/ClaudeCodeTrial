import { GscContent } from "./gsc/GscContent";
import { Ga4Content } from "./ga4/Ga4Content";
import { AiContent } from "./ai/AiContent";
import { OverviewContent } from "./overview/OverviewContent";
import { PostHogContent } from "./posthog/PostHogContent";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PresentationPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tab =
    sp.tab === "gsc" ? "gsc" :
    sp.tab === "ga4" ? "ga4" :
    sp.tab === "ai" ? "ai" :
    sp.tab === "posthog" ? "posthog" :
    "overview";

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
  const posthogHref = hrefFor("posthog");

  const hrefs = { overviewHref, gscHref, ga4Href, aiHref, posthogHref };

  if (tab === "ga4") return <Ga4Content searchParams={sp} {...hrefs} />;
  if (tab === "ai") return <AiContent searchParams={sp} {...hrefs} />;
  if (tab === "gsc") return <GscContent searchParams={sp} {...hrefs} />;
  if (tab === "posthog") return <PostHogContent searchParams={sp} {...hrefs} />;
  return <OverviewContent searchParams={sp} {...hrefs} />;
}
