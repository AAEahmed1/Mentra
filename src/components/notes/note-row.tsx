"use client";

import { updateNoteAction, deleteNoteAction } from "@/lib/actions/note";
import { useInlineEdit, useRowAction } from "@/lib/use-row-actions";
import type { Note } from "@/generated/prisma/client";
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
import { Textarea } from "@/components/ui/textarea";
import type { WorkOption } from "@/lib/work-options";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

type CourseOption = { id: string; name: string };

export function NoteRow({
  note,
  courseName,
  workTitle,
  courses,
  work,
}: {
  note: Note;
  courseName: string | null;
  workTitle: string | null;
  courses: CourseOption[];
  work: WorkOption[];
}) {
  const edit = useInlineEdit(updateNoteAction);
  const remove = useRowAction(deleteNoteAction);

  if (!edit.isEditing) {
    const metadata = [courseName, dateFormatter.format(note.createdAt)]
      .filter(Boolean)
      .join(" · ");

    return (
      <FiledRow
        align="start"
        actions={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={edit.open}>
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove.run("noteId", note.id)}
              disabled={remove.isPending}
            >
              Remove
            </Button>
          </>
        }
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{note.title}</p>
          <div className="mt-0.5">
            <RowMeta>{metadata}</RowMeta>
          </div>
          {workTitle && (
            <p className="mt-1 text-xs text-muted-foreground">
              About{" "}
              <span className="text-foreground">{workTitle}</span>
            </p>
          )}
          <p className="mt-2 max-w-[58ch] text-sm whitespace-pre-wrap text-muted-foreground">
            {note.body}
          </p>
        </div>
      </FiledRow>
    );
  }

  return (
    <FiledRowEditing>
      <form action={edit.submit} className="flex flex-col gap-3">
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

        <div className="flex flex-col gap-2">
          <Label htmlFor={`edit-note-task-${note.id}`}>
            About a piece of work{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select
            id={`edit-note-task-${note.id}`}
            name="taskId"
            defaultValue={note.taskId ?? ""}
          >
            <option value="">Not about anything in particular</option>
            {work.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} — {item.detail}
              </option>
            ))}
          </Select>
        </div>

        <FormErrors errors={edit.errors} />
        <EditActions isPending={edit.isPending} onCancel={edit.cancel} />
      </form>
    </FiledRowEditing>
  );
}
