"use client";

import { useState } from "react";

import { AssistantThread } from "@/components/assistant/assistant-thread";
import { Button } from "@/components/ui/button";

export function AssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-40 shadow-[0_10px_20px_-8px_color-mix(in_oklab,var(--foreground)_55%,transparent)]"
      >
        Ask Mentra
      </Button>
    );
  }

  return (
    <aside
      aria-label="Mentra assistant"
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

      <AssistantThread variant="panel" />
    </aside>
  );
}
