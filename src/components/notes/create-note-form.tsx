"use client";

import { createNoteAction } from "@/lib/actions/note";
import { useQuickForm } from "@/lib/use-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { WorkOption } from "@/lib/work-options";

type CourseOption = { id: string; name: string };

export function CreateNoteForm({
  courses,
  work,
}: {
  courses: CourseOption[];
  work: WorkOption[];
}) {
  const form = useQuickForm(createNoteAction);

  return (
    <form
      key={form.formKey}
      method="post"
      onSubmit={form.onSubmit}
      className="flex flex-col gap-3"
    >
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


      <div className="flex flex-col gap-2">
        <Label htmlFor={"note-task"}>
          About a piece of work{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Select id={"note-task"} name="taskId" defaultValue={""}>
          <option value="">Not about anything in particular</option>
          {work.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} — {item.detail}
            </option>
          ))}
        </Select>
      </div>

      {form.errors.length > 0 && (
        <div
          role="alert"
          className="rounded-xs border border-destructive/45 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {form.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <Button
        type="submit"
        disabled={!form.isHydrated || form.isPending}
        variant="outline"
      >
        {form.isPending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
