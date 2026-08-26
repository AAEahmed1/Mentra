import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * A filed row — one record in a list, in its resting state.
 *
 * `align` is "start" where the content runs to several lines (a note's body,
 * a memory's sentence) so the actions stay level with the title rather than
 * floating to the middle of the block.
 */
export function FiledRow({
  align = "center",
  children,
  actions,
}: {
  align?: "center" | "start";
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex flex-wrap justify-between gap-2 bg-card px-4 py-3",
        align === "start" ? "items-start" : "items-center"
      )}
    >
      {children}
      <div className="flex items-center gap-1">{actions}</div>
    </li>
  );
}

/** The same row, opened for editing — the form supplies its own layout. */
export function FiledRowEditing({ children }: { children: ReactNode }) {
  return <li className="bg-card px-4 py-3">{children}</li>;
}

/** The stamped metadata line under a row's title. */
export function RowMeta({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs tabular-nums-mono text-muted-foreground">
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
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
