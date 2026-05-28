"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useEffect } from "react";
import { useNavigation } from "./NavigationContext";

function TabContent({ href, label, active }: { href: string; label: string; active: boolean }) {
  const { pending } = useLinkStatus();
  const { pendingHref, setPendingHref } = useNavigation();

  useEffect(() => {
    if (!pending) return;
    setPendingHref(href);
    document.body.dataset.navigating = "true";
    return () => {
      setPendingHref(null);
      delete document.body.dataset.navigating;
    };
  }, [pending, href, setPendingHref]);

  // Show as active if I'm the pending tab, or if no tab is pending and I'm the
  // URL-active one. The previously-active tab de-highlights immediately on click.
  const showActive = pendingHref ? pendingHref === href : active;

  return (
    <span
      className={`relative z-10 block px-3 py-1 text-sm transition-colors ${
        showActive ? "text-black" : "text-gray-300 hover:text-white"
      }`}
    >
      {label}
    </span>
  );
}

export function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} prefetch className="relative inline-block">
      <TabContent href={href} label={label} active={active} />
    </Link>
  );
}
