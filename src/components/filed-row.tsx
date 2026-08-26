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
        "group flex flex-wrap justify-between gap-x-4 gap-y-2 border-b border-rule py-3.5 last:border-b-0",
        align === "start" ? "items-start" : "items-center"
      )}
    >
      {children}
      {/* Actions stay out of the way until the row is under the pointer. */}
      <div className="flex items-center gap-1 opacity-100 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
        {actions}
      </div>
    </li>
  );
}

/** The same row, opened for editing — the form supplies its own layout. */
export function FiledRowEditing({ children }: { children: ReactNode }) {
  return <li className="border-b border-rule py-4 last:border-b-0">{children}</li>;
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
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
