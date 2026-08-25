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
    <form action={formAction} className="flex flex-col items-end gap-1.5">
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
