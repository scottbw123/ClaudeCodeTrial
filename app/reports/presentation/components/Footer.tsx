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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/omniflow-logo.png"
            alt="OMNIFLOW"
            className="h-7 w-auto"
            style={{ filter: "invert(1) brightness(2)" }}
          />
        </div>
      </footer>
      <p className="max-w-[1400px] mx-auto px-6 py-3 text-xs text-gray-500">
        Data Last Updated: {stamp}
      </p>
    </>
  );
}
