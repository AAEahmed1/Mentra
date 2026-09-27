"use client";

import { useActionState, useTransition, type FormEvent } from "react";

import {
  changePasswordAction,
  type PasswordActionState,
} from "@/lib/actions/profile";
import { MIN_PASSWORD_LENGTH } from "@/lib/profile";
import { useHydrated } from "@/lib/use-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The action's state plus how many changes have succeeded. `saved` alone can't
 * key the form: two successful changes in a row leave it true, so the form
 * would not remount and the second password would stay in the fields.
 */
type CountedState = PasswordActionState & { successes: number };

const initialState: CountedState = { errors: [], saved: false, successes: 0 };

async function countedChange(
  previous: CountedState,
  formData: FormData
): Promise<CountedState> {
  const { errors, saved } = previous;
  const next = await changePasswordAction({ errors, saved }, formData);
  return { ...next, successes: previous.successes + (next.saved ? 1 : 0) };
}

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    countedChange,
    initialState,
  );
  const [, startTransition] = useTransition();
  const isHydrated = useHydrated();

  // See profile-form.tsx: `<form action={formAction}>` has React reset every
  // uncontrolled field once the action settles, whatever it returned — which
  // would wipe a rejected password change along with a successful one.
  // Submitting through `onSubmit` skips that automatic reset; success still
  // empties the fields, but on purpose, via the `key` remount below.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    // Keyed on each success so the fields empty once the password has changed.
    <form
      key={state.successes}
      method="post"
      onSubmit={onSubmit}
      className="flex max-w-md flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
        <p className="text-xs text-muted-foreground">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>

      {state.errors.length > 0 && (
        <div
          role="alert"
          className="rounded-xs border border-destructive/45 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={!isHydrated || isPending}>
          {isPending ? "Changing…" : "Change password"}
        </Button>
        {state.saved && !isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            Password changed. Other devices have been signed out.
          </p>
        )}
      </div>
    </form>
  );
}
