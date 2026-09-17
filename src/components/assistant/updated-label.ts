import { studentClock } from "@/lib/timezone";

const DAY_MS = 86_400_000;

// Formatted in UTC because the date it is given is already the student's clock.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Whole days since the epoch, read off a clock Date's UTC calendar fields. */
function calendarDay(clock: Date): number {
  return Math.floor(
    Date.UTC(clock.getUTCFullYear(), clock.getUTCMonth(), clock.getUTCDate()) /
      DAY_MS
  );
}

/**
 * When a chat was last used, as the Chats list shows it: "Today", "Yesterday",
 * or a short date — all on the student's own calendar.
 *
 * Calendar days, not elapsed ones. A chat from 23:00 last night is "Yesterday"
 * at 08:00 this morning, though fewer than 24 hours have passed. `now` is the
 * student's clock (from `getStudentTime`); `updatedAt` is a real instant from
 * the database, so it is converted into the same clock before comparing.
 */
export function updatedLabel(
  updatedAt: Date,
  now: Date,
  timeZone: string
): string {
  const updated = studentClock(updatedAt, timeZone);
  const daysAgo = calendarDay(now) - calendarDay(updated);

  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return dateFormatter.format(updated);
}
