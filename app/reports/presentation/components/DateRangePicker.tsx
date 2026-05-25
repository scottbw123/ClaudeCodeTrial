"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromIso(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function Calendar({
  visibleMonth,
  onMonthChange,
  selectedStart,
  selectedEnd,
  maxDate,
  picks,
  onPick,
}: {
  visibleMonth: Date;
  onMonthChange: (delta: number) => void;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  maxDate: Date;
  picks: "start" | "end";
  onPick: (d: Date) => void;
}) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const totalDays = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
  while (cells.length < 42) cells.push(null);

  const startMs = selectedStart?.getTime();
  const endMs = selectedEnd?.getTime();

  return (
    <div className="w-64">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => onMonthChange(-1)} className="px-2 py-1 text-sm hover:bg-gray-100" aria-label="Previous month">‹</button>
        <div className="text-sm font-medium not-italic">{monthLabel(visibleMonth)}</div>
        <button type="button" onClick={() => onMonthChange(1)} className="px-2 py-1 text-sm hover:bg-gray-100" aria-label="Next month">›</button>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-[10px] uppercase tracking-wide text-gray-400 mb-1 not-italic">
        {WEEKDAYS.map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const ms = c.getTime();
          const disabled = ms > maxDate.getTime();
          const isThisPick = picks === "start" ? startMs === ms : endMs === ms;
          const inRange = startMs && endMs && ms >= startMs && ms <= endMs;
          const bg = disabled
            ? "text-gray-300 cursor-not-allowed"
            : isThisPick
            ? "bg-black text-white"
            : inRange
            ? "bg-gray-200 text-gray-900"
            : "hover:bg-gray-100 text-gray-700";
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onPick(c)}
              className={`h-7 text-xs tabular-nums transition-colors ${bg}`}
            >
              {c.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({ startDate, endDate, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const [stagedStart, setStagedStart] = useState<Date | null>(fromIso(startDate));
  const [stagedEnd, setStagedEnd] = useState<Date | null>(fromIso(endDate));
  const [leftMonth, setLeftMonth] = useState<Date>(() => {
    const d = fromIso(startDate) ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [rightMonth, setRightMonth] = useState<Date>(() => {
    const d = fromIso(endDate) ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;
    setStagedStart(fromIso(startDate));
    setStagedEnd(fromIso(endDate));
    const s = fromIso(startDate) ?? new Date();
    const e = fromIso(endDate) ?? new Date();
    setLeftMonth(new Date(s.getFullYear(), s.getMonth(), 1));
    setRightMonth(new Date(e.getFullYear(), e.getMonth(), 1));
  }, [open, startDate, endDate]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  function applyAndClose() {
    if (stagedStart && stagedEnd) {
      const s = stagedStart <= stagedEnd ? stagedStart : stagedEnd;
      const e = stagedStart <= stagedEnd ? stagedEnd : stagedStart;
      onApply(toIso(s), toIso(e));
    }
    setOpen(false);
  }

  const valid = stagedStart && stagedEnd && stagedStart <= stagedEnd;
  const triggerLabel = startDate && endDate ? `${startDate} → ${endDate}` : "Pick a custom range";

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border border-gray-300 bg-white px-3 py-1.5 text-sm hover:border-gray-400 tabular-nums"
      >
        {triggerLabel} ▾
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-300 shadow-xl p-4">
          <div className="flex gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-2 not-italic font-semibold">Start date</div>
              <Calendar
                visibleMonth={leftMonth}
                onMonthChange={(delta) => setLeftMonth(addMonths(leftMonth, delta))}
                selectedStart={stagedStart}
                selectedEnd={stagedEnd}
                maxDate={maxDate}
                picks="start"
                onPick={(d) => setStagedStart(d)}
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-2 not-italic font-semibold">End date</div>
              <Calendar
                visibleMonth={rightMonth}
                onMonthChange={(delta) => setRightMonth(addMonths(rightMonth, delta))}
                selectedStart={stagedStart}
                selectedEnd={stagedEnd}
                maxDate={maxDate}
                picks="end"
                onPick={(d) => setStagedEnd(d)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 tabular-nums">
              {stagedStart ? toIso(stagedStart) : "Select start"} → {stagedEnd ? toIso(stagedEnd) : "Select end"}
              {stagedStart && stagedEnd && !valid && <span className="text-rose-600 ml-2">end is before start</span>}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900">Cancel</button>
              <button
                type="button"
                onClick={applyAndClose}
                disabled={!valid}
                className="text-xs px-3 py-1.5 bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
