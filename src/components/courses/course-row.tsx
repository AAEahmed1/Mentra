"use client";

import { useState, useTransition } from "react";

import { updateCourseAction } from "@/lib/actions/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteCourseButton } from "@/components/courses/delete-course-button";

type Course = {
  id: string;
  name: string;
  code: string | null;
  professor: string | null;
  credits: number | null;
};

export function CourseRow({ course }: { course: Course }) {
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateCourseAction({ errors: [] }, formData);
      if (result.errors.length > 0) {
        setErrors(result.errors);
        return;
      }
      setErrors([]);
      setIsEditing(false);
    });
  }

  if (!isEditing) {
    const metadata = [
      course.code,
      course.professor,
      course.credits ? `${course.credits} credits` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <li className="flex flex-wrap items-center justify-between gap-2 bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium">{course.name}</p>
          {metadata && (
            <p className="font-mono text-xs tabular-nums-mono text-muted-foreground">
              {metadata}
            </p>
          )}
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
          <DeleteCourseButton courseId={course.id} />
        </div>
      </li>
    );
  }

  return (
    <li className="bg-card px-4 py-3">
      <form action={handleSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="courseId" value={course.id} />

        <div className="flex flex-col gap-2">
          <Label htmlFor={`edit-name-${course.id}`}>Course name</Label>
          <Input
            id={`edit-name-${course.id}`}
            name="name"
            defaultValue={course.name}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-code-${course.id}`}>
              Code <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`edit-code-${course.id}`}
              name="code"
              defaultValue={course.code ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-professor-${course.id}`}>
              Professor{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`edit-professor-${course.id}`}
              name="professor"
              defaultValue={course.professor ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-credits-${course.id}`}>
              Credits{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`edit-credits-${course.id}`}
              name="credits"
              type="number"
              min={0}
              defaultValue={course.credits ?? ""}
            />
          </div>
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
