"use client";

import { useActionState } from "react";

import { createNoteAction, type NoteActionState } from "@/lib/actions/note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: NoteActionState = { errors: [] };

type CourseOption = { id: string; name: string };

export function CreateNoteForm({ courses }: { courses: CourseOption[] }) {
  const [state, formAction, isPending] = useActionState(
    createNoteAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          name="title"
          placeholder="e.g. Subnetting cheatsheet"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note-body">Note</Label>
        <Textarea id="note-body" name="body" rows={4} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note-course">
          Course <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Select id="note-course" name="courseId" defaultValue="">
          <option value="">No course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </Select>
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

      <Button type="submit" disabled={isPending} variant="outline">
        {isPending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
