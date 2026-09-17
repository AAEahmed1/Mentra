"use client";

import { deleteCourseAction } from "@/lib/actions/course";
import { useRowAction } from "@/lib/use-row-actions";
import { ConfirmAction } from "@/components/confirm-action";

/**
 * Removing a course keeps its work and notes but unfiles all of them, so it is
 * asked twice. Returns the row action too, so the row can print its error.
 */
export function useDeleteCourse() {
  return useRowAction(deleteCourseAction);
}

export function DeleteCourseButton({
  courseId,
  courseName,
  remove,
}: {
  courseId: string;
  courseName: string;
  remove: ReturnType<typeof useDeleteCourse>;
}) {
  return (
    <ConfirmAction
      label="Remove"
      itemName={courseName}
      onConfirm={() => remove.run("courseId", courseId)}
      isPending={remove.isPending}
    />
  );
}
