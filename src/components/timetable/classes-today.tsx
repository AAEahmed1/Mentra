import Link from "next/link";

import { formatClockTime, MEETING_KIND_LABELS } from "@/lib/meeting";
import type { TimetableMeeting } from "@/lib/timetable";
import { cn } from "@/lib/utils";
import { RunningHead } from "@/components/running-head";

/** Today's classes in time order. One that has finished is set in grey. */
export function ClassesToday({
  meetings,
  nowMinute,
}: {
  meetings: TimetableMeeting[];
  nowMinute: number;
}) {
  return (
    <section aria-labelledby="classes-today-heading" className="flex flex-col gap-4">
      <RunningHead
        id="classes-today-heading"
        trailing={
          <Link
            href="/timetable"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Timetable
          </Link>
        }
      >
        Classes today
      </RunningHead>
      <ul className="flex flex-col">
        {meetings.map((meeting) => {
          const ends = meeting.startMinute + meeting.durationMinutes;
          const over = ends <= nowMinute;

          return (
            <li
              key={meeting.id}
              className={cn(
                "flex gap-4 border-b border-rule py-2",
                over && "text-muted-foreground"
              )}
            >
              <span data-figures className="w-28 shrink-0 text-sm">
                {formatClockTime(meeting.startMinute)}–{formatClockTime(ends)}
              </span>
              <span className="text-sm">
                {meeting.course.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {[MEETING_KIND_LABELS[meeting.kind], meeting.location]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {over && <span className="sr-only"> (finished)</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
