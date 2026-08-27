"use client";

import { useActionState } from "react";

import {
  deleteSemesterAction,
  type DeleteSemesterActionState,
} from "@/lib/actions/semester";
import { Button } from "@/components/ui/button";

const initialState: DeleteSemesterActionState = { error: null };

export function DeleteSemesterButton({ semesterId }: { semesterId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteSemesterAction,
    initialState
  );

  return (
    /*
      Revealed on hover or keyboard focus at md and above, and always present
      below it where there is no hover. This is the same disclosure every row
      action uses: destruction is stated when reached for, not shouted from
      the top of the page next to the term's own name.
    */
    <form
      action={formAction}
      className="flex flex-col items-end gap-1.5 transition-opacity md:opacity-0 md:group-hover/term:opacity-100 md:group-focus-within/term:opacity-100"
    >
      <input type="hidden" name="semesterId" value={semesterId} />
      <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
        {isPending ? "Deleting…" : "Delete semester"}
      </Button>
      {state.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
