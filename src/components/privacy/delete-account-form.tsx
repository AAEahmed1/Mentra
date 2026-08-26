"use client";

import { useActionState } from "react";

import {
  deleteAccountAction,
  type DeleteAccountActionState,
} from "@/lib/actions/memory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: DeleteAccountActionState = { error: null };

export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        This permanently deletes your account and everything in it — semesters,
        courses, tasks, notes, and memories. It cannot be undone.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="delete-confirmation">
          Type <span className="font-mono">DELETE</span> to confirm
        </Label>
        <Input
          id="delete-confirmation"
          name="confirmation"
          autoComplete="off"
          aria-invalid={!!state.error}
          required
        />
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={isPending}
        className="self-start"
      >
        {isPending ? "Deleting…" : "Delete my account"}
      </Button>
    </form>
  );
}
