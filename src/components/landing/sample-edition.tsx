import { buildSampleTerm } from "@/lib/landing-sample";
import { explainRecommendation } from "@/lib/recommendation-reason";
import { countdown, dueLabel } from "@/lib/due-label";
import { TermScore } from "@/components/term-score";
import { RunningHead } from "@/components/running-head";
import { DurationBar } from "@/components/duration-bar";
import { StateLamp } from "@/components/state-lamp";

/**
 * The edition a visitor reads before they have one of their own.
 *
 * Every piece of it is the real thing — the term table, today's entry, the
 * ranked table beneath — printed from example work by the same code that
 * prints a student's dashboard. Nothing here is a picture of the product.
 * It differs from the dashboard in exactly two ways: the work is an example,
 * and there is nothing to open, because there is no account yet.
 */
export function SampleEdition({ now }: { now: Date }) {
  const { ranked, courseNameById } = buildSampleTerm(now);
  const [struck, ...rest] = ranked;

  // A note against one entry, so the table's hover card shows what it can.
  const noteCountByTaskId = new Map([["precedent", 1]]);

  const struckCourse = struck.task.courseId
    ? (courseNameById.get(struck.task.courseId) ?? null)
    : null;
  const struckOverdue = struck.factors.urgency === "overdue";
  const figures = countdown(struck.factors.daysUntilDue);

  return (
    <div className="flex flex-col gap-10">
      <TermScore
        heading="An example term"
        ranked={ranked}
        courseNameById={courseNameById}
        noteCountByTaskId={noteCountByTaskId}
        now={now}
      />

      <section aria-labelledby="example-now" className="flex flex-col gap-5">
        <RunningHead id="example-now" tone="now">
          Now
        </RunningHead>

        <article className="animate-struck">
          <div
            className={`animate-band flex items-center justify-between gap-4 px-4 py-2.5 ${
              struckOverdue
                ? "bg-plate-over text-plate-over-ink"
                : "bg-plate-now text-plate-now-ink"
            }`}
          >
            <span className="text-[0.6875rem] font-semibold tracking-[0.16em] uppercase">
              Today&apos;s entry
            </span>
            <span className="flex items-baseline gap-2">
              <span
                data-figures
                className="font-display text-xl leading-none font-semibold"
              >
                {figures.figure}
              </span>
              <span className="text-[0.6875rem] font-semibold tracking-[0.16em] uppercase">
                {figures.word}
              </span>
            </span>
          </div>

          <div className="border-b border-rule px-4 pt-5 pb-6">
            <h3 className="font-display text-[2rem] leading-[1.12] font-semibold tracking-[-0.02em] text-balance sm:text-[2.375rem]">
              {struck.task.title}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {struckCourse && (
                <span className="text-sm text-muted-foreground">
                  {struckCourse}
                </span>
              )}
              <DurationBar minutes={struck.task.estimatedDuration} />
            </div>

            <p className="mt-5 max-w-[65ch] border-l border-rule pl-3 text-sm text-muted-foreground italic">
              {explainRecommendation(struck.factors)}
            </p>
          </div>
        </article>

        <div className="mt-3 flex flex-col gap-4">
          <RunningHead>After that</RunningHead>

          <table className="almanac-table">
            <thead>
              <tr>
                <th scope="col" className="w-6">
                  <span className="sr-only">State</span>
                </th>
                <th scope="col">Work</th>
                <th scope="col" className="hidden sm:table-cell">
                  Course
                </th>
                <th scope="col" className="hidden w-40 sm:table-cell">
                  Estimate
                </th>
                <th scope="col" className="w-24 text-right">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              {rest.map((entry) => {
                const course = entry.task.courseId
                  ? (courseNameById.get(entry.task.courseId) ?? null)
                  : null;
                const overdue = entry.factors.urgency === "overdue";
                const today = entry.factors.daysUntilDue === 0;

                return (
                  <tr key={entry.task.id}>
                    <td>
                      <StateLamp
                        state={overdue ? "over" : today ? "today" : "on-track"}
                      />
                    </td>
                    <td className="pr-4 text-sm">
                      {entry.task.title}
                      {entry.factors.priority !== "medium" && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {entry.factors.priority} priority
                        </span>
                      )}
                      <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                        {course}
                      </span>
                    </td>
                    <td className="hidden pr-4 text-xs text-muted-foreground sm:table-cell">
                      {course}
                    </td>
                    <td className="hidden pr-4 sm:table-cell">
                      <DurationBar minutes={entry.task.estimatedDuration} />
                    </td>
                    <td
                      data-figures
                      className={
                        overdue
                          ? "text-right text-sm font-medium text-attention"
                          : today
                            ? "text-right text-sm font-medium text-now"
                            : "text-right text-sm"
                      }
                    >
                      {dueLabel(entry.factors.daysUntilDue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="max-w-[65ch] text-xs text-muted-foreground">
            An example: five architecture courses and eight pieces of work,
            dated from today. Your edition is printed from your own.
          </p>
        </div>
      </section>
    </div>
  );
}
