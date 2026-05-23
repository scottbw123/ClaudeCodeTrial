import { GscContent } from "./gsc/GscContent";
import { Ga4Content } from "./ga4/Ga4Content";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PresentationPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tab = sp.tab === "ga4" ? "ga4" : "gsc";

  const shared = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "tab") shared.set(k, v);
  }
  const sharedStr = shared.toString();
  const gscHref = `?tab=gsc${sharedStr ? `&${sharedStr}` : ""}`;
  const ga4Href = `?tab=ga4${sharedStr ? `&${sharedStr}` : ""}`;

  if (tab === "ga4") {
    return <Ga4Content searchParams={sp} gscHref={gscHref} ga4Href={ga4Href} />;
  }
  return <GscContent searchParams={sp} gscHref={gscHref} ga4Href={ga4Href} />;
}
