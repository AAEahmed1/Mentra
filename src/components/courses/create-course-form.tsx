"use client";

import { useActionState } from "react";

import {
  createCourseAction,
  type CourseActionState,
} from "@/lib/actions/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CourseActionState = { errors: [] };

export function CreateCourseForm({ semesterId }: { semesterId: string }) {
  const [state, formAction, isPending] = useActionState(
    createCourseAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="semesterId" value={semesterId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={`course-name-${semesterId}`}>Course name</Label>
        <Input
          id={`course-name-${semesterId}`}
          name="name"
          placeholder="e.g. Network Security"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`course-code-${semesterId}`}>
            Code <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id={`course-code-${semesterId}`} name="code" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`course-professor-${semesterId}`}>
            Professor <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id={`course-professor-${semesterId}`} name="professor" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`course-credits-${semesterId}`}>
            Credits <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id={`course-credits-${semesterId}`}
            name="credits"
            type="number"
            min={0}
          />
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

      <Button type="submit" disabled={isPending} variant="outline">
        {isPending ? "Adding…" : "Add course"}
      </Button>
    </form>
  );
}
