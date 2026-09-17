import type { TaskStatus } from "@/generated/prisma/enums";

export type EffectiveStatus = TaskStatus | "overdue";

const OPEN_STATUSES: readonly TaskStatus[] = [
  "not_started",
  "in_progress",
  "paused",
];

const DAY_MS = 86_400_000;

/**
 * Whole calendar days from `now` until `date`: 0 today, 1 tomorrow, negative
 * once it has passed. Both are read by their UTC calendar fields, which for
 * `now` is the student's own day (see `studentClock`).
 *
 * A deadline is a day, not an instant: something due today is due today all
 * day. Flooring the millisecond difference made a task due at midnight read as
 * "1 day over" by lunchtime, which is both wrong and alarming.
 */
export function calendarDaysUntil(date: Date, now: Date): number {
  const target = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return Math.round((target - today) / DAY_MS);
}

export function getEffectiveStatus(
  status: TaskStatus,
  dueDate: Date | null,
  now: Date
): EffectiveStatus {
  if (!OPEN_STATUSES.includes(status)) {
    return status;
  }

  // Calendar days, not elapsed hours: work due at 9am is not overdue at noon,
  // it is due today. Comparing timestamps put the amber "overdue" mark on work
  // whose own counter still read "Today", and the two must never disagree.
  if (dueDate && calendarDaysUntil(dueDate, now) < 0) {
    return "overdue";
  }

  return status;
}
