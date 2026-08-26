"use client";

import { useState, useTransition } from "react";

import { updateTaskAction, completeTaskAction, deleteTaskAction } from "@/lib/actions/task";
import { getEffectiveStatus } from "@/lib/task-status";
import type { Task } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const STATUS_LABEL: Record<Task["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

type CourseOption = { id: string; name: string };

export function TaskRow({
  task,
  courseName,
  courses,
}: {
  task: Task;
  courseName: string | null;
  courses: CourseOption[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateTaskAction({ errors: [] }, formData);
      if (result.errors.length > 0) {
        setErrors(result.errors);
        return;
      }
      setErrors([]);
      setIsEditing(false);
    });
  }

  function handleComplete() {
    const formData = new FormData();
    formData.set("taskId", task.id);
    startTransition(() => completeTaskAction(formData));
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("taskId", task.id);
    startTransition(() => deleteTaskAction(formData));
  }

  const effectiveStatus = getEffectiveStatus(
    task.status,
    task.dueDate,
    new Date()
  );
  const isResolved = task.status === "completed" || task.status === "cancelled";

  if (!isEditing) {
    const metadata = [
      courseName,
      task.dueDate ? `Due ${dateFormatter.format(task.dueDate)}` : null,
      task.priority !== "medium" ? `${task.priority} priority` : null,
      task.actualDuration
        ? `${task.actualDuration} min`
        : task.estimatedDuration
          ? `~${task.estimatedDuration} min`
          : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <li className="flex flex-wrap items-center justify-between gap-2 bg-card px-4 py-3">
        <div>
          <p
            className={
              isResolved
                ? "text-sm font-medium text-muted-foreground line-through"
                : "text-sm font-medium"
            }
          >
            {task.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {metadata && (
              <p className="font-mono text-xs tabular-nums-mono text-muted-foreground">
                {metadata}
              </p>
            )}
            {effectiveStatus === "overdue" ? (
              <span className="whitespace-nowrap rounded-full bg-tab-due px-2 py-0.5 text-xs font-medium text-tab-due-foreground">
                Overdue
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {STATUS_LABEL[task.status]}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isResolved && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleComplete}
              disabled={isPending}
            >
              Complete
            </Button>
          )}
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
        <input type="hidden" name="taskId" value={task.id} />

        <div className="flex flex-col gap-2">
          <Label htmlFor={`edit-title-${task.id}`}>Title</Label>
          <Input
            id={`edit-title-${task.id}`}
            name="title"
            defaultValue={task.title}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`edit-description-${task.id}`}>
            Description <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id={`edit-description-${task.id}`}
            name="description"
            defaultValue={task.description ?? ""}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-course-${task.id}`}>
              Course <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select
              id={`edit-course-${task.id}`}
              name="courseId"
              defaultValue={task.courseId ?? ""}
            >
              <option value="">No course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-type-${task.id}`}>Type</Label>
            <Select
              id={`edit-type-${task.id}`}
              name="type"
              defaultValue={task.type}
            >
              <option value="task">Task</option>
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-status-${task.id}`}>Status</Label>
            <Select
              id={`edit-status-${task.id}`}
              name="status"
              defaultValue={task.status}
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-due-date-${task.id}`}>
              Due date <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`edit-due-date-${task.id}`}
              name="dueDate"
              type="date"
              defaultValue={
                task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-priority-${task.id}`}>Priority</Label>
            <Select
              id={`edit-priority-${task.id}`}
              name="priority"
              defaultValue={task.priority}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-estimated-${task.id}`}>
              Est. minutes{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`edit-estimated-${task.id}`}
              name="estimatedDuration"
              type="number"
              min={0}
              defaultValue={task.estimatedDuration ?? ""}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`edit-topics-${task.id}`}>
            Topics to review{" "}
            <span className="text-muted-foreground">(exams, optional)</span>
          </Label>
          <Input
            id={`edit-topics-${task.id}`}
            name="topicsToReview"
            defaultValue={task.topicsToReview ?? ""}
          />
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
