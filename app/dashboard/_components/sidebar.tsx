"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
    </svg>
  );
}
function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}
function SandboxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9h16M9 4v16" />
    </svg>
  );
}
function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <ellipse cx="12" cy="8" rx="8" ry="3.4" />
      <path d="M4 8c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4" />
      <path d="M4 12.5c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4" />
    </svg>
  );
}

const NAV = [
  { href: "/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/dashboard/orders", label: "Orders", icon: OrdersIcon },
  { divider: true as const },
  { href: "/dashboard/support", label: "Support", icon: SupportIcon },
  { href: "/dashboard/sandbox", label: "Sandbox", icon: SandboxIcon },
];

export function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-gray-200/70 flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 text-ink">
        <Logo />
        <span className="font-semibold tracking-tight text-lg">OMNIFLOW</span>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
        {NAV.map((item, i) =>
          "divider" in item ? (
            <hr key={`d-${i}`} className="my-2 border-gray-200/70" />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-white text-ink font-semibold shadow-sm"
                  : "text-gray-500 hover:text-ink hover:bg-white/60"
              }`}
            >
              <item.icon />
              {item.label}
            </Link>
          ),
        )}
      </nav>

      <div className="border-t border-gray-200/70 p-3">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-white/60 transition-colors disabled:opacity-50"
          title="Sign out"
        >
          <span className="h-8 w-8 shrink-0 rounded-full bg-brand-soft text-brand grid place-items-center text-xs font-semibold">
            {initials || "·"}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink truncate">{name}</span>
            <span className="block text-xs text-gray-400 truncate">{email}</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
