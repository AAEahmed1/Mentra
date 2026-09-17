"use client";

import { useEffect, useRef, useState } from "react";

import { AssistantThread } from "@/components/assistant/assistant-thread";
import { Button } from "@/components/ui/button";

const PANEL_ID = "assistant-panel";

export function AssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  // Focus only goes back to the button after the panel was actually open, not
  // on first mount, where it would steal focus from the page.
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true;
      panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      openButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Hidden rather than unmounted while the panel is open, so it is still
          there to take focus back the moment the panel closes. */}
      <Button
        ref={openButtonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        hidden={isOpen}
        className="fixed right-6 bottom-6 z-40 shadow-[0_10px_20px_-8px_color-mix(in_oklab,var(--foreground)_55%,transparent)]"
      >
        Ask Mentra
      </Button>

      {/* The panel itself stays in the page while closed, because aria-controls
          needs something to point at. The thread inside mounts on opening, as
          it always has, so it opens scrolled to the latest line. */}
      <aside
        ref={panelRef}
        id={PANEL_ID}
        aria-label="Mentra assistant"
        hidden={!isOpen}
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l-2 border-rule-strong bg-card shadow-[0_0_60px_-12px_color-mix(in_oklab,var(--foreground)_45%,transparent)]"
      >
        {/* The panel carries its own masthead: the same heavy rule the page and
            the index carry, so an overlay still reads as part of the edition. */}
        <header className="flex items-center justify-between gap-3 border-b-2 border-rule-strong px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-base leading-snug font-semibold tracking-[-0.01em]">
              Ask Mentra
            </h2>
            <p className="text-xs text-muted-foreground">
              Reads your courses, work and notes before answering
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </header>

        {isOpen && <AssistantThread variant="panel" />}
      </aside>
    </>
  );
}
