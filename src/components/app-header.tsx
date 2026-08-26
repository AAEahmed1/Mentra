import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/tasks", label: "Tasks" },
  { href: "/notes", label: "Notes" },
  { href: "/privacy", label: "Privacy" },
] as const;

/**
 * The shared page chrome: wordmark left, section links + controls right.
 *
 * `current` omits the link for the page you're already on. The row wraps
 * rather than overflowing — with five sections plus controls it no longer
 * fits one line at phone widths.
 */
export function AppHeader({ current }: { current?: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border px-6 py-4">
      {current === "/dashboard" ? (
        <span className="font-serif text-base font-semibold tracking-tight text-primary">
          Mentra
        </span>
      ) : (
        <Link
          href="/dashboard"
          className="font-serif text-base font-semibold tracking-tight text-primary"
        >
          Mentra
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-x-1">
        {NAV.filter((item) => item.href !== current).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
