import Link from "next/link";

import type { Task } from "@/generated/prisma/client";
import type { MeetingWithCourse } from "@/lib/services/meeting";
import { TASK_TYPE_LABELS } from "@/lib/task";
import { calendarDaysUntil } from "@/lib/task-status";
import { dueLabel } from "@/lib/due-label";
import { RunningHead } from "@/components/running-head";
import { MeetingRow } from "@/components/timetable/meeting-row";
import { AddMeetingForm } from "@/components/timetable/add-meeting-form";
import { AddCourseworkForm } from "@/components/courses/add-coursework-form";

/**
 * A course, opened: when it meets and what is coming up in it. Folded by
 * default so a term with eight courses still reads as a list of eight.
 */
export function CoursePanel({
  courseId,
  courseName,
  meetings,
  coursework,
  now,
}: {
  courseId: string;
  courseName: string;
  meetings: MeetingWithCourse[];
  coursework: Task[];
  now: Date;
}) {
  const summary = [
    meetings.length === 0
      ? "No class times"
      : `${meetings.length} class time${meetings.length === 1 ? "" : "s"}`,
    `${coursework.length} open`,
  ].join(" · ");

  return (
    <details className="group/course">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-muted-foreground select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-3 shrink-0 transition-transform group-open/course:rotate-90"
        >
          <polyline points="4.5,2.5 8,6 4.5,9.5" />
        </svg>
        <span className="sr-only">{courseName}, </span>
        <span data-figures>{summary}</span>
      </summary>

      <div className="mt-4 flex flex-col gap-6 pl-5">
        <section className="flex flex-col gap-3">
          <RunningHead as="h3">Class times</RunningHead>
          {meetings.length > 0 && (
            <ul className="flex flex-col">
              {meetings.map((meeting) => (
                <MeetingRow key={meeting.id} meeting={meeting} />
              ))}
            </ul>
          )}
          <AddMeetingForm idPrefix={`meeting-${courseId}`} courseId={courseId} />
        </section>

        <section className="flex flex-col gap-3">
          <RunningHead as="h3">Coursework</RunningHead>
          {coursework.length > 0 && (
            <ul className="flex flex-col">
              {coursework.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule py-2"
                >
                  <span className="text-sm">
                    {task.title}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {TASK_TYPE_LABELS[task.type]}
                    </span>
                  </span>
                  <span data-figures className="text-xs text-muted-foreground">
                    {dueLabel(task.dueDate ? calendarDaysUntil(task.dueDate, now) : null)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <AddCourseworkForm courseId={courseId} />
          {coursework.length > 0 && (
            <Link
              href="/tasks"
              className="self-start text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Edit or complete these on Work
            </Link>
          )}
        </section>
      </div>
    </details>
  );
}
