"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * A row action that removes something, asked twice.
 *
 * Removing a course, a piece of work, a note or a memory cannot be undone, and
 * the button sits one pixel from Edit. The first press turns the button into a
 * question in place — no dialog, nothing covering the list — and only the
 * second carries it out. Escape or "Keep" backs out.
 *
 * `itemName` names the row for screen readers, so "Remove" in a list of twenty
 * rows says which one it removes.
 */
export function ConfirmAction({
  label,
  itemName,
  onConfirm,
  isPending,
}: {
  label: string;
  itemName: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Move focus with the question, and back to the button when it is dropped,
  // so a keyboard reader is never left on an element that has disappeared.
  useEffect(() => {
    if (isConfirming) {
      confirmRef.current?.focus();
    } else if (wasConfirming.current) {
      triggerRef.current?.focus();
    }
    wasConfirming.current = isConfirming;
  }, [isConfirming]);

  if (!isConfirming) {
    return (
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`${label} ${itemName}`}
        onClick={() => setIsConfirming(true)}
        disabled={isPending}
      >
        {isPending ? "Working…" : label}
      </Button>
    );
  }

  return (
    <span
      role="group"
      aria-label={`${label} ${itemName}?`}
      className="flex items-center gap-1"
      onKeyDown={(event) => {
        if (event.key === "Escape") setIsConfirming(false);
      }}
    >
      <span className="px-1 text-xs text-muted-foreground">
        {label} for good?
      </span>
      <Button
        ref={confirmRef}
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => {
          setIsConfirming(false);
          onConfirm();
        }}
      >
        {label}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsConfirming(false)}
      >
        Keep
      </Button>
    </span>
  );
}
