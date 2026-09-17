import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * A filed row — one record in a list, in its resting state.
 *
 * Set the way a table is set: banded stock behind alternating rows, a hairline
 * between them and a heavy rule closing the last one. The band bleeds 8px past
 * the measure on both sides so the text still lines up with the headings above
 * it while the stock reads as continuous.
 *
 * `align` is "start" where the content runs to several lines (a note's body,
 * a memory's sentence) so the actions stay level with the title rather than
 * floating to the middle of the block.
 */
export function FiledRow({
  align = "center",
  children,
  actions,
  error = null,
}: {
  align?: "center" | "start";
  children: ReactNode;
  actions: ReactNode;
  /** Why a row action (complete, remove, forget) did not happen. */
  error?: string | null;
}) {
  return (
    <li
      className={cn(
        "group -mx-2 flex flex-wrap justify-between gap-x-4 gap-y-2 border-b border-rule px-2 py-3.5 even:bg-band last:border-b-2 last:border-rule-strong",
        align === "start" ? "items-start" : "items-center"
      )}
    >
      {children}
      {/*
        Actions stay out of the way until the row is under the pointer — but
        only where there is a pointer that can hover. A tablet at md width with
        no mouse keeps them visible, as a phone does.
      */}
      <div className="flex items-center gap-1 opacity-100 transition-opacity focus-within:opacity-100 md:pointer-fine:opacity-0 md:pointer-fine:group-hover:opacity-100">
        {actions}
      </div>
      {error && (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}

/** The same row, opened for editing — the form supplies its own layout. */
export function FiledRowEditing({ children }: { children: ReactNode }) {
  return (
    <li className="-mx-2 border-b border-rule px-2 py-4 even:bg-band last:border-b-2 last:border-rule-strong">
      {children}
    </li>
  );
}

/** The metadata line under a row's title. */
export function RowMeta({ children }: { children: ReactNode }) {
  return (
    <p data-figures className="text-xs text-muted-foreground">
      {children}
    </p>
  );
}

/** Validation errors, shown in place rather than as a toast that vanishes. */
export function FormErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-xs border border-destructive/45 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {errors.map((error) => (
        <p key={error}>{error}</p>
      ))}
    </div>
  );
}

/** Save/Cancel, the footer of every in-place edit form. */
export function EditActions({
  isPending,
  onCancel,
}: {
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
