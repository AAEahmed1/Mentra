"use client";

import { updateTaskAction, completeTaskAction, deleteTaskAction } from "@/lib/actions/task";
import { useInlineEdit, useRowAction } from "@/lib/use-row-actions";
import { getEffectiveStatus } from "@/lib/task-status";
import type { Task } from "@/generated/prisma/client";
import {
  EditActions,
  FiledRow,
  FiledRowEditing,
  FormErrors,
  RowMeta,
} from "@/components/filed-row";
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
  const edit = useInlineEdit(updateTaskAction);
  const complete = useRowAction(completeTaskAction);
  const remove = useRowAction(deleteTaskAction);

  const effectiveStatus = getEffectiveStatus(
    task.status,
    task.dueDate,
    new Date()
  );
  const isResolved = task.status === "completed" || task.status === "cancelled";

  if (!edit.isEditing) {
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
      <FiledRow
        actions={
          <>
            {!isResolved && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => complete.run("taskId", task.id)}
                disabled={complete.isPending}
              >
                Complete
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={edit.open}>
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove.run("taskId", task.id)}
              disabled={remove.isPending}
            >
              Remove
            </Button>
          </>
        }
      >
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
            {metadata && <RowMeta>{metadata}</RowMeta>}
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
      </FiledRow>
    );
  }

  return (
    <FiledRowEditing>
      <form action={edit.submit} className="flex flex-col gap-3">
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

        <FormErrors errors={edit.errors} />
        <EditActions isPending={edit.isPending} onCancel={edit.cancel} />
      </form>
    </FiledRowEditing>
  );
}
