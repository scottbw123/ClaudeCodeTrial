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
  hoverDate,
  onPick,
  onHover,
}: {
  visibleMonth: Date;
  onMonthChange: (delta: number) => void;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  hoverDate: Date | null;
  onPick: (d: Date) => void;
  onHover: (d: Date | null) => void;
}) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const totalDays = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  const startMs = selectedStart?.getTime();
  const endMs = selectedEnd?.getTime();
  const hoverMs = hoverDate?.getTime();

  // For the "in range" highlight while user is picking the end date
  const previewEnd = !selectedEnd && hoverDate && selectedStart && hoverMs! >= startMs! ? hoverDate : selectedEnd;
  const previewEndMs = previewEnd?.getTime();

  return (
    <div className="w-64">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => onMonthChange(-1)}
          className="px-2 py-1 text-sm hover:bg-gray-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="text-sm font-medium not-italic">{monthLabel(visibleMonth)}</div>
        <button
          type="button"
          onClick={() => onMonthChange(1)}
          className="px-2 py-1 text-sm hover:bg-gray-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-[10px] uppercase tracking-wide text-gray-400 mb-1 not-italic">
        {WEEKDAYS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const ms = c.getTime();
          const isStart = startMs === ms;
          const isEnd = endMs === ms;
          const inRange =
            startMs && previewEndMs && ms > startMs && ms < previewEndMs;
          const bg = isStart || isEnd
            ? "bg-black text-white"
            : inRange
            ? "bg-gray-200 text-gray-900"
            : "hover:bg-gray-100 text-gray-700";
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(c)}
              onMouseEnter={() => onHover(c)}
              onMouseLeave={() => onHover(null)}
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

  // Staged values inside the popup
  const [stagedStart, setStagedStart] = useState<Date | null>(fromIso(startDate));
  const [stagedEnd, setStagedEnd] = useState<Date | null>(fromIso(endDate));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [leftMonth, setLeftMonth] = useState<Date>(() => {
    const d = fromIso(startDate) ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    if (open) {
      setStagedStart(fromIso(startDate));
      setStagedEnd(fromIso(endDate));
      const d = fromIso(startDate) ?? new Date();
      setLeftMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [open, startDate, endDate]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  function pick(d: Date) {
    if (!stagedStart || (stagedStart && stagedEnd)) {
      setStagedStart(d);
      setStagedEnd(null);
      return;
    }
    if (d < stagedStart) {
      setStagedStart(d);
      setStagedEnd(null);
      return;
    }
    setStagedEnd(d);
  }

  function applyAndClose() {
    if (stagedStart && stagedEnd) {
      onApply(toIso(stagedStart), toIso(stagedEnd));
    }
    setOpen(false);
  }

  const triggerLabel =
    startDate && endDate
      ? `${startDate} → ${endDate}`
      : "Pick a custom range";

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
          <div className="flex gap-4">
            <Calendar
              visibleMonth={leftMonth}
              onMonthChange={(delta) => setLeftMonth(addMonths(leftMonth, delta))}
              selectedStart={stagedStart}
              selectedEnd={stagedEnd}
              hoverDate={hoverDate}
              onPick={pick}
              onHover={setHoverDate}
            />
            <Calendar
              visibleMonth={addMonths(leftMonth, 1)}
              onMonthChange={(delta) => setLeftMonth(addMonths(leftMonth, delta))}
              selectedStart={stagedStart}
              selectedEnd={stagedEnd}
              hoverDate={hoverDate}
              onPick={pick}
              onHover={setHoverDate}
            />
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 tabular-nums">
              {stagedStart ? toIso(stagedStart) : "Select start"}
              {" → "}
              {stagedEnd ? toIso(stagedEnd) : "Select end"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyAndClose}
                disabled={!stagedStart || !stagedEnd}
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
