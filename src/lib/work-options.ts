import { calendarDaysUntil, getEffectiveStatus } from "@/lib/task-status";
import type { RankableTask } from "@/lib/recommendations";

/**
 * One line of the work picker: enough context to recognise a piece of work
 * without opening it, which is what makes the list browsable rather than a
 * wall of near-identical titles.
 */
export type WorkOption = {
  id: string;
  title: string;
  detail: string;
};

type PickableTask = RankableTask & { courseId: string | null };

function dueDetail(daysUntilDue: number | null, overdue: boolean): string {
  if (daysUntilDue === null) return "no deadline";
  if (overdue) {
    const days = Math.abs(daysUntilDue);
    return `${days} day${days === 1 ? "" : "s"} over`;
  }
  if (daysUntilDue === 0) return "due today";
  if (daysUntilDue === 1) return "due tomorrow";
  return `due in ${daysUntilDue} days`;
}

/**
 * Turns the student's open work into pickable lines, soonest first.
 *
 * Finished and abandoned work is left out: attaching a note to something you
 * have already closed is almost never what you meant, and including it would
 * bury the handful of live items you were actually looking for.
 */
export function toWorkOptions(
  tasks: PickableTask[],
  courseNameById: Map<string, string>,
  now: Date
): WorkOption[] {
  return tasks
    .filter(
      (task) => task.status !== "completed" && task.status !== "cancelled"
    )
    .map((task) => {
      const days = task.dueDate ? calendarDaysUntil(task.dueDate, now) : null;
      const overdue =
        getEffectiveStatus(task.status, task.dueDate, now) === "overdue";
      const course = task.courseId
        ? courseNameById.get(task.courseId)
        : undefined;

      return {
        id: task.id,
        title: task.title,
        detail: [course, dueDetail(days, overdue)].filter(Boolean).join(" · "),
        sortKey: days ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ id, title, detail }) => ({ id, title, detail }));
}
