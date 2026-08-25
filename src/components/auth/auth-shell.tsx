import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

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
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-serif text-lg font-semibold tracking-tight text-primary">
          Mentra
        </span>
        <p className="text-sm text-muted-foreground">
          Your academic life, understood.
        </p>
      </div>

      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_oklch(0_0_0/0.06),0_8px_24px_-8px_oklch(0_0_0/0.18)]">
        <div className="flex items-center gap-3 border-b border-border bg-cardstock px-6 py-5">
          <div
            aria-hidden="true"
            className="flex shrink-0 flex-col gap-1.5 opacity-40"
          >
            <span className="size-1 rounded-full bg-foreground" />
            <span className="size-1 rounded-full bg-foreground" />
            <span className="size-1 rounded-full bg-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-lg leading-snug font-semibold text-balance">
              {title}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="bg-cardstock px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
