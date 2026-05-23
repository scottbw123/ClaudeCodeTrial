import { formatHumanDate } from "@/lib/date-utils";

export function PresentationHeader({
  title,
  startDate,
  endDate,
}: {
  title: string;
  startDate: string;
  endDate: string;
}) {
  return (
    <header className="bg-black text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-4 grid grid-cols-3 items-center">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden>
            <path
              fill="white"
              d="M16 4c-2 4-6 6-10 6 4 0 8 2 10 6 2-4 6-6 10-6-4 0-8-2-10-6zM6 16c0 5.5 4.5 10 10 10s10-4.5 10-10c-3 4-7 6-10 6s-7-2-10-6z"
            />
          </svg>
          <span className="text-lg font-bold tracking-wide">OMNIFLOW</span>
        </div>
        <h1 className="text-center text-2xl font-bold">{title}</h1>
        <div className="justify-self-end inline-flex items-center gap-2 rounded-md bg-neutral-800 px-3 py-1.5 text-sm">
          <span>
            {formatHumanDate(startDate)} – {formatHumanDate(endDate)}
          </span>
        </div>
      </div>
    </header>
  );
}
