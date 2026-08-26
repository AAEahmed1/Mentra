import type { TaskStatus } from "@/generated/prisma/enums";

export type EffectiveStatus = TaskStatus | "overdue";

const OPEN_STATUSES: readonly TaskStatus[] = [
  "not_started",
  "in_progress",
  "paused",
];

function startOfDay(date: Date): number {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
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
  if (dueDate && startOfDay(dueDate) < startOfDay(now)) {
    return "overdue";
  }

  return status;
}
