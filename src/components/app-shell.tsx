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
      {/* First in the tab order, visible only when focused, so a keyboard
          reader can pass the seven section links on every page. */}
      <a
        href="#main-content"
        className="sr-only z-[70] rounded-xs bg-plate-now px-3 py-2 text-sm font-medium text-plate-now-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Skip to content
      </a>
      <AppSidebar />

      {/* Clipped sideways: an entry at the far end of the term table, or its
          hover card, would otherwise widen the page and let it scroll. */}
      <div className="min-w-0 flex-1 overflow-x-clip">
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto outline-none flex max-w-4xl flex-col gap-10 px-6 py-10 pb-28 md:py-14 md:pb-20">
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
              className="h-1 bg-[linear-gradient(to_bottom,var(--rule-strong)_0_2px,transparent_2px_100%),linear-gradient(to_bottom,transparent_0_3px,var(--rule)_3px_4px)]"
            />
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
