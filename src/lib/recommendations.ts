import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { getEffectiveStatus } from "@/lib/task-status";

/**
 * The task fields ranking actually reads. Narrower than the Prisma model so
 * the function stays a pure sort over plain data, testable without a database.
 */
export type RankableTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  estimatedDuration: number | null;
};

export type Urgency = "overdue" | "due_soon" | "upcoming" | "someday";

export type RankFactors = {
  urgency: Urgency;
  /** Whole days until due; negative when overdue, null with no due date. */
  daysUntilDue: number | null;
  priority: TaskPriority;
  estimatedDuration: number | null;
  /** null when the student hasn't said how much time they have. */
  fitsAvailableTime: boolean | null;
};

export type RankedTask<T extends RankableTask = RankableTask> = {
  task: T;
  factors: RankFactors;
};

export type RankOptions = {
  now: Date;
  availableMinutes?: number | undefined;
};

const DAY_MS = 86_400_000;

/** Anything past this many days out is "upcoming" rather than pressing. */
const DUE_SOON_DAYS = 3;

const URGENCY_ORDER: Record<Urgency, number> = {
  overdue: 0,
  due_soon: 1,
  upcoming: 2,
  someday: 3,
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function daysUntil(dueDate: Date, now: Date): number {
  return Math.floor((dueDate.getTime() - now.getTime()) / DAY_MS);
}

function urgencyOf(task: RankableTask, now: Date): Urgency {
  if (!task.dueDate) return "someday";
  if (getEffectiveStatus(task.status, task.dueDate, now) === "overdue") {
    return "overdue";
  }
  return daysUntil(task.dueDate, now) <= DUE_SOON_DAYS ? "due_soon" : "upcoming";
}

function factorsFor(
  task: RankableTask,
  { now, availableMinutes }: RankOptions
): RankFactors {
  const fitsAvailableTime =
    availableMinutes === undefined
      ? null
      : task.estimatedDuration === null ||
        task.estimatedDuration <= availableMinutes;

  return {
    urgency: urgencyOf(task, now),
    daysUntilDue: task.dueDate ? daysUntil(task.dueDate, now) : null,
    priority: task.priority,
    estimatedDuration: task.estimatedDuration,
    fitsAvailableTime,
  };
}

/**
 * Orders a student's open tasks for "what should I do right now".
 *
 * Urgency buckets come first, so a low-priority thing due tomorrow beats a
 * high-priority thing due in three weeks — the ordering a student actually
 * wants. Priority only sorts within a bucket, and an equal-priority tie goes
 * to the earlier deadline.
 *
 * A task too long for the stated time is pushed down its bucket, never
 * dropped: the student may still choose to start it.
 *
 * Deliberately deterministic and AI-free — this is the fast path the
 * assistant later reads from, not the other way round.
 */
export function rankTasks<T extends RankableTask>(
  tasks: T[],
  options: RankOptions
): RankedTask<T>[] {
  return tasks
    .filter(
      (task) => task.status !== "completed" && task.status !== "cancelled"
    )
    .map((task) => ({ task, factors: factorsFor(task, options) }))
    .sort((a, b) => {
      const byUrgency =
        URGENCY_ORDER[a.factors.urgency] - URGENCY_ORDER[b.factors.urgency];
      if (byUrgency !== 0) return byUrgency;

      // Within the overdue bucket, longest overdue first.
      if (a.factors.urgency === "overdue") {
        const byOverdue =
          (a.factors.daysUntilDue ?? 0) - (b.factors.daysUntilDue ?? 0);
        if (byOverdue !== 0) return byOverdue;
      }

      const aFits = a.factors.fitsAvailableTime !== false;
      const bFits = b.factors.fitsAvailableTime !== false;
      if (aFits !== bFits) return aFits ? -1 : 1;

      const byPriority =
        PRIORITY_ORDER[a.factors.priority] - PRIORITY_ORDER[b.factors.priority];
      if (byPriority !== 0) return byPriority;

      const aDue = a.task.dueDate?.getTime() ?? Infinity;
      const bDue = b.task.dueDate?.getTime() ?? Infinity;
      return aDue - bDue;
    });
}
