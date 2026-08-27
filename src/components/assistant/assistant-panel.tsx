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
        className="fixed right-6 bottom-6 z-40 shadow-lg"
      >
        Ask Mentra
      </Button>
    );
  }

  return (
    <aside
      aria-label="Mentra assistant"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 border-l border-primary pl-3">
          <h2 className="text-base leading-snug font-semibold tracking-tight">
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
