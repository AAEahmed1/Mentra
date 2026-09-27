import type { TaskStatus, TaskType } from "@/generated/prisma/enums";
import { calendarDaysUntil } from "@/lib/task-status";

/** How far ahead Today's "Coming up" looks, in days. */
export const COMING_UP_DAYS = 14;

export type UpcomingTask = {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  dueDate: Date | null;
  courseId: string | null;
};

export type ComingUpDay<T> = { daysUntil: number; label: string; items: T[] };

const OPEN: readonly TaskStatus[] = ["not_started", "in_progress", "paused"];

/** On one day, the thing that is sat beats the thing that is handed in. */
const TYPE_ORDER: Record<TaskType, number> = {
  exam: 0,
  quiz: 1,
  assignment: 2,
  task: 3,
};

// Due dates are UTC midnight on the student's calendar, so read them in UTC.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function dayHeading(daysUntil: number, date: Date): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return dateFormatter.format(date);
}

function byTypeThenTitle(a: UpcomingTask, b: UpcomingTask): number {
  return TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.title.localeCompare(b.title);
}

/**
 * Open work due from today through `days` ahead, one group per day.
 *
 * Overdue work is left out on purpose: it already leads Today in the slipped
 * plate, and listing it again under a date that has passed says nothing new.
 */
export function comingUp<T extends UpcomingTask>(
  tasks: T[],
  now: Date,
  days: number = COMING_UP_DAYS
): ComingUpDay<T>[] {
  const byDay = new Map<number, { date: Date; items: T[] }>();

  for (const task of tasks) {
    if (!task.dueDate || !OPEN.includes(task.status)) continue;
    const daysUntil = calendarDaysUntil(task.dueDate, now);
    if (daysUntil < 0 || daysUntil > days) continue;

    const group = byDay.get(daysUntil) ?? { date: task.dueDate, items: [] };
    group.items.push(task);
    byDay.set(daysUntil, group);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([daysUntil, { date, items }]) => ({
      daysUntil,
      label: dayHeading(daysUntil, date),
      items: items.sort(byTypeThenTitle),
    }));
}

/** A course's open work, soonest first, undated at the end. */
export function courseworkFor<T extends UpcomingTask>(tasks: T[], courseId: string): T[] {
  return tasks
    .filter((task) => task.courseId === courseId && OPEN.includes(task.status))
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime() || a.title.localeCompare(b.title);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.title.localeCompare(b.title);
    });
}
