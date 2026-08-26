"use client";

import { useState, useTransition } from "react";

import { updateNoteAction, deleteNoteAction } from "@/lib/actions/note";
import type { Note } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

type CourseOption = { id: string; name: string };

export function NoteRow({
  note,
  courseName,
  courses,
}: {
  note: Note;
  courseName: string | null;
  courses: CourseOption[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateNoteAction({ errors: [] }, formData);
      if (result.errors.length > 0) {
        setErrors(result.errors);
        return;
      }
      setErrors([]);
      setIsEditing(false);
    });
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("noteId", note.id);
    startTransition(() => deleteNoteAction(formData));
  }

  if (!isEditing) {
    const metadata = [courseName, dateFormatter.format(note.createdAt)]
      .filter(Boolean)
      .join(" · ");

    return (
      <li className="flex flex-wrap items-start justify-between gap-2 bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{note.title}</p>
          <p className="mt-0.5 font-mono text-xs tabular-nums-mono text-muted-foreground">
            {metadata}
          </p>
          <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
            {note.body}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            Remove
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="bg-card px-4 py-3">
      <form action={handleUpdate} className="flex flex-col gap-3">
        <input type="hidden" name="noteId" value={note.id} />

        <div className="flex flex-col gap-2">
          <Label htmlFor={`edit-note-title-${note.id}`}>Title</Label>
          <Input
            id={`edit-note-title-${note.id}`}
            name="title"
            defaultValue={note.title}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`edit-note-body-${note.id}`}>Note</Label>
          <Textarea
            id={`edit-note-body-${note.id}`}
            name="body"
            rows={4}
            defaultValue={note.body}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`edit-note-course-${note.id}`}>
            Course <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select
            id={`edit-note-course-${note.id}`}
            name="courseId"
            defaultValue={note.courseId ?? ""}
          >
            <option value="">No course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>
        </div>

        {errors.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </li>
  );
}
