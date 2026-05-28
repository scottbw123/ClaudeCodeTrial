function formatBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function Bar({
  label,
  brandedValue,
  nonBrandedValue,
}: {
  label: string;
  brandedValue: number;
  nonBrandedValue: number;
}) {
  const total = brandedValue + nonBrandedValue;
  const brandedPct = total > 0 ? brandedValue / total : 0;
  const nbPct = total > 0 ? nonBrandedValue / total : 0;

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <span className="text-xs text-gray-500 tabular-nums">{formatBig(total)} total</span>
      </div>
      <div className="flex h-9 rounded overflow-hidden bg-gray-100">
        {brandedPct > 0 && (
          <div
            className="bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold tabular-nums"
            style={{ width: `${brandedPct * 100}%` }}
            title={`Branded: ${formatBig(brandedValue)} (${(brandedPct * 100).toFixed(1)}%)`}
          >
            {brandedPct >= 0.06 ? `${(brandedPct * 100).toFixed(1)}%` : ""}
          </div>
        )}
        {nbPct > 0 && (
          <div
            className="bg-cyan-500 flex items-center justify-center text-white text-xs font-semibold tabular-nums"
            style={{ width: `${nbPct * 100}%` }}
            title={`Non-Branded: ${formatBig(nonBrandedValue)} (${(nbPct * 100).toFixed(1)}%)`}
          >
            {nbPct >= 0.06 ? `${(nbPct * 100).toFixed(1)}%` : ""}
          </div>
        )}
      </div>
      <div className="flex justify-between text-[11px] text-gray-600 mt-1 tabular-nums">
        <span>
          <span className="inline-block w-2 h-2 rounded-sm bg-indigo-600 mr-1 align-middle" />
          Branded {formatBig(brandedValue)}
        </span>
        <span>
          Non-Branded {formatBig(nonBrandedValue)}
          <span className="inline-block w-2 h-2 rounded-sm bg-cyan-500 ml-1 align-middle" />
        </span>
      </div>
    </div>
  );
}

export function BrandedComparison({
  brandedImpressions,
  nbImpressions,
  brandedClicks,
  nbClicks,
}: {
  brandedImpressions: number;
  nbImpressions: number;
  brandedClicks: number;
  nbClicks: number;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-md p-5">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">Branded vs Non-Branded</h3>
        <p className="text-sm text-gray-500">Share of total impressions and clicks coming from branded queries.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Bar label="Impressions" brandedValue={brandedImpressions} nonBrandedValue={nbImpressions} />
        <Bar label="Clicks" brandedValue={brandedClicks} nonBrandedValue={nbClicks} />
      </div>
    </section>
  );
}
