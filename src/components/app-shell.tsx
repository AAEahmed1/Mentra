import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";

/**
 * Every signed-in page is the index plus one printed plane. The index is fixed
 * furniture; the page only ever supplies what sits to the right of it.
 *
 * The header is the edition's masthead: the title struck in the display slab,
 * the dateline beneath it, and the thick-thin rule pair closing it off — the
 * same pair that opens every region on the page below.
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
    <div className="flex min-h-svh flex-col md:flex-row">
      <AppSidebar />

      <div className="min-w-0 flex-1">
        <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10 pb-28 md:py-14 md:pb-20">
          <header>
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-4">
              <div className="min-w-0">
                <h1 className="font-display text-3xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance md:text-[2.125rem]">
                  {title}
                </h1>
                {lede && (
                  <p className="mt-2 text-sm text-muted-foreground">{lede}</p>
                )}
              </div>
              {actions}
            </div>
            {/* The masthead rule: 2px over 1px, the mark this whole edition
                is set with. */}
            <div
              aria-hidden="true"
              className="animate-rule-draw h-1 origin-left bg-[linear-gradient(to_bottom,var(--rule-strong)_0_2px,transparent_2px_100%),linear-gradient(to_bottom,transparent_0_3px,var(--rule)_3px_4px)]"
            />
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
