"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import Link from "next/link";

import {
  completeOnboardingAction,
  type OnboardingActionState,
} from "@/lib/actions/onboarding";
import { useHydrated } from "@/lib/use-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: OnboardingActionState = { errors: [] };

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    completeOnboardingAction,
    initialState
  );
  const [, startTransition] = useTransition();
  const isHydrated = useHydrated();

  // See profile-form.tsx: `<form action={formAction}>` has React reset every
  // uncontrolled field once the action settles, wiping a rejected submit's
  // input along with a successful one. Submitting through `onSubmit` skips
  // that automatic reset; success here redirects away, so there is nothing
  // left to clear anyway.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="program">
          Program <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="program"
          name="program"
          placeholder="e.g. Cybersecurity, Mechanical Engineering"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="institution">
          Institution <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="institution" name="institution" />
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

      <Button
        type="submit"
        disabled={!isHydrated || isPending}
        className="w-full"
      >
        {isPending ? "Saving…" : "Continue"}
      </Button>

      <Link
        href="/courses"
        className="text-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Skip for now
      </Link>
    </form>
  );
}
