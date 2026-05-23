export function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function shiftDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return formatIsoDate(d);
}

export function daysBetween(startIso: string, endIso: string): number {
  const s = new Date(startIso + "T00:00:00Z");
  const e = new Date(endIso + "T00:00:00Z");
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function rangeFromDays(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - days);
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
}

export function previousPeriod(startDate: string, endDate: string): { startDate: string; endDate: string } {
  const length = daysBetween(startDate, endDate);
  const prevEnd = shiftDays(startDate, -1);
  const prevStart = shiftDays(prevEnd, -length);
  return { startDate: prevStart, endDate: prevEnd };
}

export function formatHumanDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
