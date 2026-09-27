import { formatClockTime, MEETING_KIND_LABELS, weekdayLabel } from "@/lib/meeting";
import type { TimetableMeeting, WeekLayout } from "@/lib/timetable";
import { cn } from "@/lib/utils";

/** The week as lines, for screens too narrow for five columns. */
export function DayList({
  layout,
  todayWeekday,
}: {
  layout: WeekLayout<TimetableMeeting>;
  todayWeekday: number | null;
}) {
  const days = layout.days.filter((day) => day.placed.length > 0);

  return (
    <ol className="flex flex-col gap-5 sm:hidden">
      {days.map((day) => (
        <li key={day.weekday}>
          <h3
            className={cn(
              "text-xs font-semibold tracking-[0.12em] uppercase",
              day.weekday === todayWeekday ? "text-now" : "text-muted-foreground"
            )}
          >
            {weekdayLabel(day.weekday, "long")}
            {day.weekday === todayWeekday && " · Today"}
          </h3>
          <ul className="mt-2 flex flex-col">
            {[...day.placed]
              .sort((a, b) => a.meeting.startMinute - b.meeting.startMinute)
              .map(({ meeting }) => (
                <li key={meeting.id} className="flex gap-4 border-b border-rule py-2">
                  <span data-figures className="w-24 shrink-0 text-sm">
                    {formatClockTime(meeting.startMinute)}–
                    {formatClockTime(meeting.startMinute + meeting.durationMinutes)}
                  </span>
                  <span className="text-sm">
                    {meeting.course.name}
                    <span className="block text-xs text-muted-foreground">
                      {[MEETING_KIND_LABELS[meeting.kind], meeting.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
