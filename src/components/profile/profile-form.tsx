"use client";

import { useActionState, useTransition, type FormEvent } from "react";

import {
  updateProfileAction,
  type ProfileActionState,
} from "@/lib/actions/profile";
import { useHydrated } from "@/lib/use-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ProfileActionState = { errors: [], saved: false };

export function ProfileForm({
  name,
  program,
  institution,
}: {
  name: string;
  program: string | null;
  institution: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [, startTransition] = useTransition();
  const isHydrated = useHydrated();

  // A plain `<form action={formAction}>` would have React reset every
  // uncontrolled field once the action settles, whatever it returned — so a
  // rejected submission would wipe what the student typed along with a
  // successful one clearing it on purpose. Submitting through `onSubmit`
  // instead runs the action without that automatic reset; the fields being
  // uncontrolled (via `defaultValue`) means a failed save simply leaves what
  // is already on screen, edits included.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      className="flex max-w-md flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          name="name"
          defaultValue={name}
          autoComplete="name"
          maxLength={100}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-program">
          Program <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="profile-program"
          name="program"
          defaultValue={program ?? ""}
          placeholder="e.g. Cybersecurity, Mechanical Engineering"
          maxLength={120}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-institution">
          Institution <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="profile-institution"
          name="institution"
          defaultValue={institution ?? ""}
          autoComplete="organization"
          maxLength={120}
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
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        {state.saved && !isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}
