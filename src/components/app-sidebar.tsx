"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * The margin. In a score the left column names every line and never leaves the
 * page; collapsed, it shows abbreviations rather than disappearing.
 */
const SECTIONS = [
  { href: "/dashboard", label: "Today", short: "TDY" },
  { href: "/courses", label: "Courses", short: "CRS" },
  { href: "/tasks", label: "Work", short: "WRK" },
  { href: "/notes", label: "Notes", short: "NTS" },
  { href: "/privacy", label: "What Mentra knows", short: "MEM" },
] as const;

const STORAGE_KEY = "mentra:margin-collapsed";

/**
 * The collapsed preference lives in localStorage, which is external to React —
 * so it's read through a store subscription rather than synced into state by an
 * effect. That keeps the server render (always expanded) and the first client
 * render honest without a cascading re-render.
 */
const marginStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    marginStore.listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      marginStore.listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },
  getSnapshot() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Private browsing or blocked storage — the default stands.
      return false;
    }
  },
  getServerSnapshot() {
    return false;
  },
  set(collapsed: boolean) {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // The preference just won't persist; this session still works.
    }
    marginStore.listeners.forEach((listener) => listener());
  },
};

function MarginIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="size-4"
      aria-hidden="true"
    >
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <line x1="6" y1="2.5" x2="6" y2="13.5" />
      {collapsed ? (
        <polyline points="9,6 11,8 9,10" />
      ) : (
        <polyline points="11,6 9,8 11,10" />
      )}
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSyncExternalStore(
    marginStore.subscribe,
    marginStore.getSnapshot,
    marginStore.getServerSnapshot
  );

  return (
    <>
      {/* Phone: the margin lifts away, reachable from a bar that stays put. */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sections"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <MarginIcon collapsed />
        </button>
        <span className="text-sm font-semibold tracking-tight">Mentra</span>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sections"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
        />
      )}

      <nav
        aria-label="Sections"
        data-collapsed={collapsed ? "" : undefined}
        className={cn(
          "z-50 flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          "fixed inset-y-0 left-0 w-60 transition-transform duration-200 md:sticky md:top-0 md:h-svh md:translate-x-0 md:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-16" : "md:w-60"
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-sidebar-border",
            collapsed ? "md:justify-center md:px-0" : "px-4"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "text-base font-semibold tracking-tight",
              collapsed && "md:sr-only"
            )}
          >
            Mentra
          </Link>
          <button
            type="button"
            onClick={() => marginStore.set(!collapsed)}
            aria-label={collapsed ? "Expand sections" : "Collapse sections"}
            className="ml-auto hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:block"
          >
            <MarginIcon collapsed={collapsed} />
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-0.5 p-2">
          {SECTIONS.map((section) => {
            const active = pathname === section.href;
            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? section.label : undefined}
                  className={cn(
                    "relative flex items-center rounded-md py-2 text-sm transition-colors",
                    collapsed ? "md:justify-center md:px-0" : "px-3",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {/* The line the section sits on, struck when it's the open one. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 h-5 w-0.5 rounded-full transition-colors",
                      active ? "bg-sidebar-primary" : "bg-transparent"
                    )}
                  />
                  <span className={cn(collapsed && "md:hidden")}>
                    {section.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "hidden text-xs font-medium tracking-widest",
                      collapsed && "md:block"
                    )}
                  >
                    {section.short}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div
          className={cn(
            "hidden shrink-0 items-center gap-1 border-t border-sidebar-border p-2 md:flex",
            collapsed && "md:flex-col"
          )}
        >
          <ThemeToggle />
          <span className={cn(collapsed && "md:hidden")}>
            <SignOutButton />
          </span>
        </div>
      </nav>
    </>
  );
}
