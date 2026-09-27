import {
  describeMeeting,
  formatClockTime,
  MEETING_KIND_LABELS,
  weekdayLabel,
} from "@/lib/meeting";
import type { TimetableMeeting, WeekLayout } from "@/lib/timetable";
import { cn } from "@/lib/utils";

/** Height of one hour on the grid. */
const HOUR_REM = 3.5;

/** From this length a block is tall enough to give kind and place a line. */
const ROOMY_MINUTES = 60;

function details(meeting: TimetableMeeting): string {
  return [MEETING_KIND_LABELS[meeting.kind], meeting.location]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The week, drawn to scale: each class is as tall as it is long. Hidden at
 * phone width, where `DayList` prints the same week as lines instead.
 */
export function WeekGrid({
  layout,
  todayWeekday,
}: {
  layout: WeekLayout<TimetableMeeting>;
  /** Today's column, or null when the term shown is not running today. */
  todayWeekday: number | null;
}) {
  const height = ((layout.endMinute - layout.startMinute) / 60) * HOUR_REM;

  return (
    <div
      className="hidden sm:grid"
      style={{ gridTemplateColumns: `3.5rem repeat(${layout.days.length}, minmax(0, 1fr))` }}
    >
      <div aria-hidden="true" />
      {layout.days.map((day) => (
        <div
          key={day.weekday}
          aria-hidden="true"
          className={cn(
            "border-b-2 border-rule-strong pb-2 text-center text-xs font-semibold tracking-[0.12em] uppercase",
            day.weekday === todayWeekday ? "text-now" : "text-muted-foreground"
          )}
        >
          {weekdayLabel(day.weekday, "short")}
        </div>
      ))}

      {/*
        The day-header row above and the hour labels below are both decorative
        once each block below states its own weekday and course name in
        screen-reader text: the header row otherwise gives the day the block
        sits under, and this column otherwise gives no accessible name at all.
      */}
      <div aria-hidden="true" className="relative" style={{ height: `${height}rem` }}>
        {layout.hours.map((minute) => (
          <span
            key={minute}
            data-figures
            className="absolute right-2 -translate-y-1/2 text-[0.6875rem] text-muted-foreground"
            style={{ top: `${((minute - layout.startMinute) / (layout.endMinute - layout.startMinute)) * 100}%` }}
          >
            {formatClockTime(minute)}
          </span>
        ))}
      </div>

      {layout.days.map((day) => (
        <div
          key={day.weekday}
          className={cn(
            "relative border-l border-rule",
            day.weekday === todayWeekday && "bg-band"
          )}
          style={{ height: `${height}rem` }}
        >
          {layout.hours.map((minute) => (
            <div
              key={minute}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-rule/60"
              style={{ top: `${((minute - layout.startMinute) / (layout.endMinute - layout.startMinute)) * 100}%` }}
            />
          ))}
          {day.placed.map(({ meeting, lane, lanes, topPercent, heightPercent }) => (
            <div
              key={meeting.id}
              title={`${describeMeeting(meeting)} · ${meeting.course.name}`}
              className="absolute overflow-hidden rounded-xs border-l-2 border-primary bg-muted px-1.5 py-1 text-xs"
              style={{
                top: `${topPercent}%`,
                height: `${heightPercent}%`,
                left: `${(lane / lanes) * 100}%`,
                width: `${100 / lanes}%`,
              }}
            >
              {/* The visible text abbreviates to the course code; screen
                  readers get the day and full course name up front instead.
                  A class of an hour or more is tall enough for three lines,
                  so kind and place get their own line and are not cut short;
                  a shorter one folds them onto the time's line to fit. */}
              <span className="sr-only">
                {weekdayLabel(day.weekday, "long")}, {meeting.course.name},{" "}
              </span>
              <p className="truncate font-medium">{meeting.course.code ?? meeting.course.name}</p>
              <p data-figures className="truncate text-muted-foreground">
                {formatClockTime(meeting.startMinute)}–
                {formatClockTime(meeting.startMinute + meeting.durationMinutes)}
                {meeting.durationMinutes < ROOMY_MINUTES && ` · ${details(meeting)}`}
              </p>
              {meeting.durationMinutes >= ROOMY_MINUTES && (
                <p className="truncate text-muted-foreground">{details(meeting)}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
