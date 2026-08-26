import type { TaskStatus } from "@/generated/prisma/enums";

export type EffectiveStatus = TaskStatus | "overdue";

const OPEN_STATUSES: readonly TaskStatus[] = [
  "not_started",
  "in_progress",
  "paused",
];

export function getEffectiveStatus(
  status: TaskStatus,
  dueDate: Date | null,
  now: Date
): EffectiveStatus {
  if (!OPEN_STATUSES.includes(status)) {
    return status;
  }

  if (dueDate && dueDate.getTime() < now.getTime()) {
    return "overdue";
  }

  return status;
}
