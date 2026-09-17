"use client";

import { useActionState } from "react";

import {
  createSemesterAction,
  type SemesterActionState,
} from "@/lib/actions/semester";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SemesterActionState = { errors: [] };

export function CreateSemesterForm() {
  const [state, formAction, isPending] = useActionState(
    createSemesterAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Semester name</Label>
        <Input id="name" name="name" placeholder="e.g. Fall 2026" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Starts</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">Ends</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
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

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add semester"}
      </Button>
    </form>
  );
}
