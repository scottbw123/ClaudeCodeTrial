"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PreviewBanner({ clientName }: { clientName: string }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  async function exitPreview() {
    setExiting(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="bg-brand text-white text-sm">
      <div className="max-w-5xl mx-auto px-8 py-2 flex items-center justify-between gap-4">
        <span>
          Admin preview — viewing as <strong>{clientName}</strong>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="underline underline-offset-2 hover:opacity-80">
            Switch client
          </Link>
          <button
            onClick={exitPreview}
            disabled={exiting}
            className="underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
          >
            {exiting ? "Exiting…" : "Exit preview"}
          </button>
        </div>
      </div>
    </div>
  );
}
