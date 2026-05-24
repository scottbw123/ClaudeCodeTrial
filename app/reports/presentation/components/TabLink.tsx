"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useEffect } from "react";

function TabContent({ label, active }: { label: string; active: boolean }) {
  const { pending } = useLinkStatus();

  useEffect(() => {
    if (!pending) return;
    document.body.dataset.navigating = "true";
    return () => {
      delete document.body.dataset.navigating;
    };
  }, [pending]);

  // The clicked tab shows as active immediately while the new page loads.
  const showActive = pending || active;
  return (
    <span
      className={`block px-3 py-1 text-sm transition-colors ${
        showActive ? "bg-white text-black" : "text-gray-300 hover:text-white"
      }`}
    >
      {label}
    </span>
  );
}

export function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href}>
      <TabContent label={label} active={active} />
    </Link>
  );
}
