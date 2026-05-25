"use client";

import { useState } from "react";

export function DownloadPdfButton({ filename }: { filename: string }) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    // Hide interactive chrome (buttons, filter bar) for a clean deliverable.
    const hidden = Array.from(document.querySelectorAll<HTMLElement>("[data-pdf-hide]"));
    const prevDisplay = hidden.map((el) => el.style.display);
    hidden.forEach((el) => (el.style.display = "none"));

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const header = document.querySelector("header") as HTMLElement | null;
      const main = document.querySelector("main") as HTMLElement | null;
      if (!main) return;

      const opts = { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false } as const;
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
      hidden.forEach((el, i) => (el.style.display = prevDisplay[i]));
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      data-pdf-hide
      onClick={generate}
      disabled={busy}
      className="inline-flex items-center gap-1.5 bg-white text-black px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50 not-italic"
      title="Download this report as a single-page letter-width PDF"
    >
      {busy ? "Generating…" : "↓ PDF"}
    </button>
  );
}
