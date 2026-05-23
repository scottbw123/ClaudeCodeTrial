export interface DeltaRow {
  key: string;
  clicks: { current: number; changePercent: number };
  impressions: { current: number; changePercent: number };
  ctr: { current: number; changePercent: number };
  position: { current: number; changePercent: number };
}

function formatInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function Delta({ change, invert }: { change: number; invert?: boolean }) {
  if (!isFinite(change) || change === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const positive = invert ? change < 0 : change > 0;
  const color = positive ? "text-emerald-600" : "text-rose-600";
  const arrow = change > 0 ? "▲" : "▼";
  return (
    <span className={`text-xs font-medium ${color} tabular-nums`}>
      {arrow} {Math.abs(change * 100).toFixed(1)}%
    </span>
  );
}

export function DeltaTable({
  title,
  description,
  keyLabel,
  rows,
  totals,
}: {
  title: string;
  description: string;
  keyLabel: string;
  rows: DeltaRow[];
  totals: { clicks: number; impressions: number; ctr: number; position: number; clicksChange: number; impressionsChange: number; ctrChange: number; positionChange: number };
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-white text-xs">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">#</th>
              <th className="px-4 py-2 text-left font-semibold">{keyLabel}</th>
              <th className="px-4 py-2 text-right font-semibold">Impressions</th>
              <th className="px-4 py-2 text-right font-semibold">% Δ</th>
              <th className="px-4 py-2 text-right font-semibold">Clicks</th>
              <th className="px-4 py-2 text-right font-semibold">% Δ</th>
              <th className="px-4 py-2 text-right font-semibold">Avg. Position</th>
              <th className="px-4 py-2 text-right font-semibold">% Δ</th>
              <th className="px-4 py-2 text-right font-semibold">CTR</th>
              <th className="px-4 py-2 text-right font-semibold">% Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-1.5 text-gray-500">{i + 1}.</td>
                <td className="px-4 py-1.5 text-gray-900 max-w-[420px] truncate">{r.key}</td>
                <td className="px-4 py-1.5 text-right tabular-nums">{formatInt(r.impressions.current)}</td>
                <td className="px-4 py-1.5 text-right"><Delta change={r.impressions.changePercent} /></td>
                <td className="px-4 py-1.5 text-right tabular-nums">{formatInt(r.clicks.current)}</td>
                <td className="px-4 py-1.5 text-right"><Delta change={r.clicks.changePercent} /></td>
                <td className="px-4 py-1.5 text-right tabular-nums">{r.position.current.toFixed(2)}</td>
                <td className="px-4 py-1.5 text-right"><Delta change={r.position.changePercent} invert /></td>
                <td className="px-4 py-1.5 text-right tabular-nums">{formatPct(r.ctr.current)}</td>
                <td className="px-4 py-1.5 text-right"><Delta change={r.ctr.changePercent} /></td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-semibold bg-white">
              <td className="px-4 py-2"></td>
              <td className="px-4 py-2">Grand total</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatInt(totals.impressions)}</td>
              <td className="px-4 py-2 text-right"><Delta change={totals.impressionsChange} /></td>
              <td className="px-4 py-2 text-right tabular-nums">{formatInt(totals.clicks)}</td>
              <td className="px-4 py-2 text-right"><Delta change={totals.clicksChange} /></td>
              <td className="px-4 py-2 text-right tabular-nums">{totals.position.toFixed(2)}</td>
              <td className="px-4 py-2 text-right"><Delta change={totals.positionChange} invert /></td>
              <td className="px-4 py-2 text-right tabular-nums">{formatPct(totals.ctr)}</td>
              <td className="px-4 py-2 text-right"><Delta change={totals.ctrChange} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
