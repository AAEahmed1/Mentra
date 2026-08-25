"use client";

import { deleteCourseAction } from "@/lib/actions/course";
import { Button } from "@/components/ui/button";

export function DeleteCourseButton({ courseId }: { courseId: string }) {
  return (
    <form action={deleteCourseAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        aria-label="Delete course"
      >
        Remove
      </Button>
    </form>
  );
}
