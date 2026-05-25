"use client";

import { useState } from "react";

// The header logo is a dark PNG flipped to white via a CSS `invert` filter.
// html2canvas-pro does not apply that filter, so we pre-bake a white silhouette
// and swap it into the cloned document before capture.
async function makeWhiteLogo(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function DownloadPdfButton({ filename }: { filename: string }) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const [{ default: html2canvas }, { jsPDF }, whiteLogo] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
        makeWhiteLogo("/omniflow-logo.png"),
      ]);

      const header = document.querySelector("header") as HTMLElement | null;
      const main = document.querySelector("main") as HTMLElement | null;
      if (!main) return;

      // Mutate only the cloned document html2canvas renders — the live page is
      // untouched, so the button stays visible with its loading state.
      const onclone = (doc: Document) => {
        doc.querySelectorAll<HTMLElement>("[data-pdf-hide]").forEach((el) => {
          el.style.display = "none";
        });
        if (whiteLogo) {
          doc.querySelectorAll<HTMLImageElement>('img[alt="OMNIFLOW"]').forEach((img) => {
            img.src = whiteLogo;
            img.style.filter = "none";
          });
        }
      };

      const opts = { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false, onclone } as const;
      const canvases: HTMLCanvasElement[] = [];
      if (header) canvases.push(await html2canvas(header, opts));
      canvases.push(await html2canvas(main, opts));

      const width = Math.max(...canvases.map((c) => c.width));
      const totalHeight = canvases.reduce((s, c) => s + c.height, 0);

      const combined = document.createElement("canvas");
      combined.width = width;
      combined.height = totalHeight;
      const ctx = combined.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, totalHeight);
      let y = 0;
      for (const c of canvases) {
        ctx.drawImage(c, 0, y);
        y += c.height;
      }

      const pdfW = 612; // US Letter width in points (8.5in × 72)
      const pdfH = (totalHeight / width) * pdfW;
      const pdf = new jsPDF({ unit: "pt", format: [pdfW, pdfH] });
      pdf.addImage(combined.toDataURL("image/png"), "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");
      pdf.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Could not generate the PDF. Check the console for details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      data-pdf-hide
      onClick={generate}
      disabled={busy}
      aria-busy={busy}
      className={`relative inline-flex items-center gap-1.5 bg-white text-black px-3 py-1.5 text-sm not-italic ${busy ? "cursor-wait" : "hover:bg-gray-100"}`}
      title="Download this report as a single-page letter-width PDF"
    >
      <span className={busy ? "blur-[2px] opacity-50" : ""}>↓ PDF</span>
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="w-4 h-4 animate-spin text-black" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
        </span>
      )}
    </button>
  );
}
