import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The way in — the edition's title page.
 *
 * The wordmark over the same 2px rule the app's masthead carries, then the
 * heading set in the display slab, then the form. Same stock, same plates,
 * same rules as everything behind the sign-in; there is simply no term to
 * print yet.
 */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-lg font-semibold tracking-[-0.01em]">
            Mentra
          </span>
          <span
            aria-hidden="true"
            className="rule-pair animate-rule-draw self-center"
          />
        </div>

        <div className="mt-9">
          <h1 className="font-display text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
