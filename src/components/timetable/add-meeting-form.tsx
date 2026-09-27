"use client";

import { createMeetingAction } from "@/lib/actions/meeting";
import { MEETING_KINDS, MEETING_KIND_LABELS, WEEKDAYS } from "@/lib/meeting";
import { useQuickForm } from "@/lib/use-row-actions";
import { FormErrors } from "@/components/filed-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type CourseOption = { id: string; name: string };

/**
 * Adds a class time on one or more days. It stays open and clears after
 * saving, because a course's lecture is usually followed by its lab.
 *
 * Under a course it is given `courseId`; on the timetable it is given the
 * term's `courses` and asks which one.
 */
export function AddMeetingForm({
  idPrefix,
  courseId,
  courses,
}: {
  idPrefix: string;
  courseId?: string;
  courses?: CourseOption[];
}) {
  const form = useQuickForm(createMeetingAction);

  return (
    <form
      key={form.formKey}
      method="post"
      onSubmit={form.onSubmit}
      className="flex flex-col gap-3"
    >
      {courseId ? (
        <input type="hidden" name="courseId" value={courseId} />
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-course`}>Course</Label>
          <Select id={`${idPrefix}-course`} name="courseId" defaultValue="" required>
            <option value="" disabled>
              Pick a course
            </option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Days</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {WEEKDAYS.map((day) => (
            <label key={day.value} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="weekday"
                value={day.value}
                className="size-4 accent-primary"
              />
              <span aria-hidden="true">{day.short}</span>
              <span className="sr-only">{day.long}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-kind`}>Kind</Label>
          <Select id={`${idPrefix}-kind`} name="kind" defaultValue="lecture">
            {MEETING_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {MEETING_KIND_LABELS[kind]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-start`}>Starts</Label>
          <Input id={`${idPrefix}-start`} name="startTime" type="time" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-duration`}>Minutes</Label>
          <Input
            id={`${idPrefix}-duration`}
            name="durationMinutes"
            type="number"
            min={5}
            max={720}
            step={5}
            defaultValue={50}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-location`}>
            Where <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id={`${idPrefix}-location`} name="location" />
        </div>
      </div>

      <FormErrors errors={form.errors} />

      <Button
        type="submit"
        disabled={!form.isHydrated || form.isPending}
        variant="outline"
      >
        {form.isPending ? "Adding…" : "Add class time"}
      </Button>
    </form>
  );
}
