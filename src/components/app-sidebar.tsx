"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * The index. An almanac names its tables in a column that never leaves the
 * page, and the table you are reading is the one that has been inked.
 */
const SECTIONS = [
  { href: "/dashboard", label: "Today", icon: "today" },
  { href: "/courses", label: "Courses", icon: "courses" },
  { href: "/tasks", label: "Work", icon: "work" },
  { href: "/notes", label: "Notes", icon: "notes" },
  { href: "/chats", label: "Chats", icon: "chats" },
  { href: "/privacy", label: "What Mentra knows", icon: "memory" },
  { href: "/profile", label: "Profile", icon: "profile" },
] as const;

/**
 * One stroke weight, one grid, drawn rather than lettered. The collapsed rail
 * used invented consonant-strips (TDY, CRS) which are neither words nor icons
 * and were hidden from assistive tech besides.
 */
function SectionIcon({ name }: { name: (typeof SECTIONS)[number]["icon"] }) {
  const paths: Record<typeof name, React.ReactNode> = {
    today: (
      <>
        <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" />
        <line x1="2.5" y1="7" x2="15.5" y2="7" />
        <line x1="9" y1="10.5" x2="9" y2="15.5" />
      </>
    ),
    courses: (
      <>
        <path d="M3 4.5h5a2 2 0 0 1 2 2v8a1.5 1.5 0 0 0-1.5-1.5H3z" />
        <path d="M15 4.5h-5a2 2 0 0 0-2 2v8a1.5 1.5 0 0 1 1.5-1.5H15z" />
      </>
    ),
    work: (
      <>
        <rect x="2.5" y="5.5" width="13" height="9" rx="1.5" />
        <path d="M6.5 5.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
      </>
    ),
    notes: (
      <>
        <path d="M4 2.5h6.5L14 6v9.5H4z" />
        <path d="M10.5 2.5V6H14" />
      </>
    ),
    chats: (
      <>
        <path d="M2.5 4.5h13v8h-7l-3.5 3v-3h-2.5z" />
      </>
    ),
    memory: (
      <>
        <circle cx="9" cy="9" r="6" />
        <path d="M9 5.5v3.5l2.5 1.5" />
      </>
    ),
    profile: (
      <>
        <circle cx="9" cy="6.5" r="3" />
        <path d="M3.5 15.5a5.5 5.5 0 0 1 11 0" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px] shrink-0"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

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
      <div className="flex items-center gap-2 border-b-2 border-rule-strong px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sections"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <MarginIcon collapsed />
        </button>
        <span className="font-display text-base font-semibold tracking-[-0.01em]">
          Mentra
        </span>
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
        {/* The head of the index carries the same 2px rule the page's masthead
            does, so the two columns read as one printed sheet. */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b-2 border-rule-strong",
            collapsed ? "md:justify-center md:px-0" : "px-4"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "font-display text-lg font-semibold tracking-[-0.01em]",
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

        <ul className="flex flex-1 flex-col divide-y divide-sidebar-border border-b border-sidebar-border">
          {SECTIONS.map((section) => {
            const active = pathname === section.href;
            return (
              <li key={section.href}>
                {/*
                  The open section is inked as a solid band running the whole
                  width of the index — the same move today's entry makes on the
                  page. A wash tint would have been an accent; this is the plate
                  owning a region, which is how this world spends colour.
                */}
                <Link
                  href={section.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? section.label : undefined}
                  className={cn(
                    "relative flex items-center py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    collapsed ? "md:justify-center md:px-0" : "px-4",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <SectionIcon name={section.icon} />
                  <span className={cn("ml-2.5", collapsed && "md:hidden")}>
                    {section.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div
          className={cn(
            "hidden shrink-0 items-center gap-1 border-t-2 border-rule-strong p-2 md:flex",
            collapsed && "md:flex-col"
          )}
        >
          <ThemeToggle />
          <SignOutButton collapsed={collapsed} />
        </div>
      </nav>
    </>
  );
}
