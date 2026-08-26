"use client";

import { updateCourseAction } from "@/lib/actions/course";
import { useInlineEdit } from "@/lib/use-row-actions";
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
import { DeleteCourseButton } from "@/components/courses/delete-course-button";

type Course = {
  id: string;
  name: string;
  code: string | null;
  professor: string | null;
  credits: number | null;
};

export function CourseRow({ course }: { course: Course }) {
  const edit = useInlineEdit(updateCourseAction);

  if (!edit.isEditing) {
    const metadata = [
      course.code,
      course.professor,
      course.credits ? `${course.credits} credits` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <FiledRow
        actions={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={edit.open}>
              Edit
            </Button>
            <DeleteCourseButton courseId={course.id} />
          </>
        }
      >
        <div>
          <p className="text-sm font-medium">{course.name}</p>
          {metadata && <RowMeta>{metadata}</RowMeta>}
        </div>
      </FiledRow>
    );
  }

  return (
    <FiledRowEditing>
      <form action={edit.submit} className="flex flex-col gap-3">
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
              Credits <span className="text-muted-foreground">(optional)</span>
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

        <FormErrors errors={edit.errors} />
        <EditActions isPending={edit.isPending} onCancel={edit.cancel} />
      </form>
    </FiledRowEditing>
  );
}
