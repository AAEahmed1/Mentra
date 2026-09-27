import type { ComingUpDay, UpcomingTask } from "@/lib/coming-up";
import { TASK_TYPE_LABELS } from "@/lib/task";
import { RunningHead } from "@/components/running-head";

/** The next two weeks of work, a day at a time. */
export function ComingUp({
  days,
  courseNameById,
}: {
  days: ComingUpDay<UpcomingTask>[];
  courseNameById: Map<string, string>;
}) {
  return (
    <section aria-labelledby="coming-up-heading" className="flex flex-col gap-4">
      <RunningHead id="coming-up-heading">Coming up</RunningHead>
      <ol className="flex flex-col gap-5">
        {days.map((day) => (
          <li key={day.daysUntil}>
            <h3
              data-figures
              className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
            >
              {day.label}
            </h3>
            <ul className="mt-2 flex flex-col">
              {day.items.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule py-2"
                >
                  <span className="text-sm">
                    {task.title}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {TASK_TYPE_LABELS[task.type]}
                    </span>
                  </span>
                  {task.courseId && (
                    <span className="text-xs text-muted-foreground">
                      {courseNameById.get(task.courseId)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
