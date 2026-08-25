"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  completeOnboardingAction,
  type OnboardingActionState,
} from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: OnboardingActionState = { errors: [] };

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    completeOnboardingAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
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
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
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
