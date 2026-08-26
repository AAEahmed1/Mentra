"use client";

import { updateTaskAction, completeTaskAction, deleteTaskAction } from "@/lib/actions/task";
import { useInlineEdit, useRowAction } from "@/lib/use-row-actions";
import { getEffectiveStatus } from "@/lib/task-status";
import type { Note, Task } from "@/generated/prisma/client";
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
import { QuickNoteForm } from "@/components/tasks/quick-note-form";

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
  notes,
  courses,
}: {
  task: Task;
  courseName: string | null;
  notes: Note[];
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
        <div className="min-w-0 flex-1">
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

          {/*
            Always present, because a note can be written about any piece of
            work — not only the ones that already have some. A disclosure
            rather than always-open: a row with three notes would otherwise
            push every other piece of work off the screen. <details> gives the
            toggle and its keyboard behaviour for free.
          */}
          <details className="group/notes mt-2">
              {/*
                Styled as a button rather than plain text: the count is worth
                seeing while scanning, so it stays visible at rest instead of
                joining the hover-revealed actions — but it has to look like
                something you can press.
              */}
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 select-none rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-3 transition-transform group-open/notes:rotate-90"
                >
                  <polyline points="4.5,2.5 8,6 4.5,9.5" />
                </svg>
                {notes.length === 0
                  ? "Add a note"
                  : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
              </summary>

              <div className="mt-2 flex max-w-[58ch] flex-col gap-4 border-l border-rule pl-3">
                {notes.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {notes.map((note) => (
                      <li key={note.id}>
                        <p className="text-xs font-medium">{note.title}</p>
                        <p className="mt-0.5 text-xs whitespace-pre-wrap text-muted-foreground">
                          {note.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                <QuickNoteForm taskId={task.id} />
              </div>
            </details>
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
