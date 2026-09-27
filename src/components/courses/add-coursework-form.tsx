"use client";

import { createTaskAction } from "@/lib/actions/task";
import { TASK_TYPES, TASK_TYPE_LABELS } from "@/lib/task";
import { useQuickForm } from "@/lib/use-row-actions";
import { FormErrors } from "@/components/filed-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

/**
 * Adds a quiz, assignment or exam straight onto a course. It is ordinary work,
 * filed under this course, so it also appears on Work and is ranked on Today.
 * Fields the full Work form offers but this one does not (description, topics)
 * are simply left empty.
 */
export function AddCourseworkForm({ courseId }: { courseId: string }) {
  const form = useQuickForm(createTaskAction);
  const id = (field: string) => `coursework-${field}-${courseId}`;

  return (
    <form key={form.formKey} onSubmit={form.onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("title")}>What is it</Label>
          <Input id={id("title")} name="title" placeholder="e.g. Week 4 quiz" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("type")}>Type</Label>
          <Select id={id("type")} name="type" defaultValue="quiz">
            {TASK_TYPES.map((type) => (
              <option key={type} value={type}>
                {TASK_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("due")}>Date</Label>
          <Input id={id("due")} name="dueDate" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("minutes")}>
            Est. minutes <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id={id("minutes")} name="estimatedDuration" type="number" min={0} />
        </div>
      </div>
      <FormErrors errors={form.errors} />
      <Button type="submit" disabled={form.isPending} variant="outline">
        {form.isPending ? "Adding…" : "Add coursework"}
      </Button>
    </form>
  );
}
