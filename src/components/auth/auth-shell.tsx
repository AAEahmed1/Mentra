import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The way in. A single ruled column on the open page — the same margin-and-line
 * language as the app, before there is a term to draw.
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
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight">Mentra</span>
          <span aria-hidden="true" className="h-px flex-1 bg-rule" />
        </div>

        <div className="mt-10 border-l border-primary pl-5">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
