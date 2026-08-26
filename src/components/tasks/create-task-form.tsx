"use client";

import { useActionState } from "react";

import { createTaskAction, type TaskActionState } from "@/lib/actions/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: TaskActionState = { errors: [] };

type CourseOption = { id: string; name: string };

export function CreateTaskForm({ courses }: { courses: CourseOption[] }) {
  const [state, formAction, isPending] = useActionState(
    createTaskAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          name="title"
          placeholder="e.g. Network Security Lab"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="task-description">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="task-description" name="description" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-course">
            Course <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select id="task-course" name="courseId" defaultValue="">
            <option value="">No course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-type">Type</Label>
          <Select id="task-type" name="type" defaultValue="task">
            <option value="task">Task</option>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-due-date">
            Due date <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id="task-due-date" name="dueDate" type="date" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Select id="task-priority" name="priority" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-estimated-duration">
            Est. minutes{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="task-estimated-duration"
            name="estimatedDuration"
            type="number"
            min={0}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="task-topics">
          Topics to review{" "}
          <span className="text-muted-foreground">(exams, optional)</span>
        </Label>
        <Input id="task-topics" name="topicsToReview" />
      </div>

      {state.errors.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <Button type="submit" disabled={isPending} variant="outline">
        {isPending ? "Adding…" : "Add task"}
      </Button>
    </form>
  );
}
