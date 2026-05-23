export function PresentationFooter({ generatedAt }: { generatedAt: Date }) {
  const stamp = generatedAt.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return (
    <>
      <footer className="bg-black text-white mt-8">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden>
              <path
                fill="white"
                d="M16 4c-2 4-6 6-10 6 4 0 8 2 10 6 2-4 6-6 10-6-4 0-8-2-10-6zM6 16c0 5.5 4.5 10 10 10s10-4.5 10-10c-3 4-7 6-10 6s-7-2-10-6z"
              />
            </svg>
            <span className="text-lg font-bold tracking-wide">OMNIFLOW</span>
          </div>
        </div>
      </footer>
      <p className="max-w-[1400px] mx-auto px-6 py-3 text-xs text-gray-500">
        Data Last Updated: {stamp}
      </p>
    </>
  );
}
