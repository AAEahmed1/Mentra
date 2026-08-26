import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";

/**
 * Every signed-in page is the margin plus one plane of content. The margin is
 * fixed furniture; the page only ever supplies what sits to the right of it.
 */
export function AppShell({
  title,
  lede,
  actions,
  children,
}: {
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background md:flex-row">
      <AppSidebar />

      <div className="min-w-0 flex-1">
        <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10 pb-24 md:py-14 md:pb-20">
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-rule pb-5">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                {title}
              </h1>
              {lede && (
                <p className="mt-2 text-sm text-muted-foreground">{lede}</p>
              )}
            </div>
            {actions}
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
