import type { Metadata } from "next";
import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { greetingForHour } from "@/lib/greeting";
import { listTasksForUser } from "@/lib/services/task";
import { listCoursesForUser } from "@/lib/services/course";
import { rankTasks, type RankedTask } from "@/lib/recommendations";
import { explainRecommendation } from "@/lib/recommendation-reason";
import { TermScore } from "@/components/term-score";
import { DurationBar } from "@/components/duration-bar";

export const metadata: Metadata = {
  title: "Today — Mentra",
};

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

/** How many lines sit under the struck item before the score is cut off. */
const LANE_LIMIT = 6;

function dueLabel(daysUntilDue: number | null): string {
  if (daysUntilDue === null) return "No deadline";
  if (daysUntilDue < 0) {
    const days = Math.abs(daysUntilDue);
    return `${days} day${days === 1 ? "" : "s"} over`;
  }
  if (daysUntilDue === 0) return "Today";
  if (daysUntilDue === 1) return "Tomorrow";
  return `${daysUntilDue} days`;
}

/**
 * The decisive figure, at the scale it deserves. Overdue and due-today are the
 * only states that get colour; everything else is simply ink.
 */
function Countdown({ entry }: { entry: RankedTask }) {
  const { daysUntilDue, urgency } = entry.factors;
  const overdue = urgency === "overdue";
  const today = daysUntilDue === 0;

  return (
    <div className="flex shrink-0 flex-col items-end">
      <span
        data-figures
        className={
          overdue
            ? "text-4xl leading-none font-semibold tracking-tight text-attention"
            : today
              ? "text-4xl leading-none font-semibold tracking-tight text-now"
              : "text-4xl leading-none font-semibold tracking-tight"
        }
      >
        {daysUntilDue === null ? "—" : Math.abs(daysUntilDue)}
      </span>
      <span className="mt-1 text-xs text-muted-foreground">
        {daysUntilDue === null
          ? "no date"
          : overdue
            ? "days over"
            : daysUntilDue === 0
              ? "due today"
              : daysUntilDue === 1
                ? "day left"
                : "days left"}
      </span>
    </div>
  );
}

export default async function DashboardPage() {
  const userId = await requireUserId();
  const now = new Date();

  const [user, tasks, courses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, program: true },
    }),
    listTasksForUser(userId),
    listCoursesForUser(userId),
  ]);

  const courseById = new Map(courses.map((course) => [course.id, course]));
  const ranked = rankTasks(tasks, { now });
  const [struck, ...rest] = ranked;
  const lanes = rest.slice(0, LANE_LIMIT);

  const dueThisWeek = ranked.filter(
    (entry) =>
      entry.factors.daysUntilDue !== null && entry.factors.daysUntilDue <= 7
  ).length;

  const struckCourse = struck?.task.courseId
    ? (courseById.get(struck.task.courseId) ?? null)
    : null;

  return (
    <AppShell
      title={`${greetingForHour(now.getHours())}, ${user?.name ?? "there"}.`}
      lede={
        <>
          <time dateTime={now.toISOString().slice(0, 10)}>
            {dayFormatter.format(now)}
          </time>
          {" · "}
          {courses.length} course{courses.length === 1 ? "" : "s"} ·{" "}
          {ranked.length} open
          {dueThisWeek > 0 && ` · ${dueThisWeek} due this week`}
        </>
      }
    >
      {struck && (
        <TermScore
          ranked={ranked}
          courseNameById={
            new Map(courses.map((course) => [course.id, course.name]))
          }
          now={now}
        />
      )}

      {struck ? (
        <section aria-labelledby="now-heading" className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <h2
              id="now-heading"
              className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
            >
              Now
            </h2>
            <span
              aria-hidden="true"
              className="animate-now-rule h-px flex-1 bg-now"
            />
          </div>

          {/* The struck item: pulled forward off the lane it sits on. */}
          <article className="flex flex-col gap-5 border-l border-now pl-5 sm:pl-6">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h3 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance">
                  {struck.task.title}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {struckCourse && (
                    <span className="text-sm text-muted-foreground">
                      {struckCourse.name}
                    </span>
                  )}
                  <DurationBar minutes={struck.task.estimatedDuration} />
                </div>
              </div>
              <Countdown entry={struck} />
            </div>

            {/* The marking: why this line, in the score's own margin voice. */}
            <p className="max-w-[65ch] text-sm italic text-muted-foreground">
              {explainRecommendation(struck.factors)}
            </p>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/tasks"
                className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                Open my work
              </Link>
              <Link
                href="/notes"
                className="rounded-md border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                Write a note
              </Link>
            </div>
          </article>

          {lanes.length > 0 && (
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  After that
                </h2>
                <span aria-hidden="true" className="h-px flex-1 bg-rule" />
              </div>

              <ul className="flex flex-col">
                {lanes.map((entry) => {
                  const course = entry.task.courseId
                    ? (courseById.get(entry.task.courseId) ?? null)
                    : null;
                  const overdue = entry.factors.urgency === "overdue";

                  return (
                    <li
                      key={entry.task.id}
                      className="flex flex-col gap-1 border-b border-rule py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-x-4"
                    >
                      {/* The title keeps the whole width on a phone rather than
                          truncating to a fragment; the meta drops beneath it. */}
                      <span className="text-sm sm:min-w-0 sm:flex-1 sm:truncate">
                        {entry.task.title}
                      </span>
                      <span className="flex items-center gap-x-3 text-xs text-muted-foreground">
                        {course && (
                          <span className="hidden shrink-0 sm:block">
                            {course.name}
                          </span>
                        )}
                        {/* Priority is what put a distant item above a nearer
                            one; say so, or the order looks arbitrary. */}
                        {entry.factors.priority !== "medium" && (
                          <span className="shrink-0">
                            {entry.factors.priority} priority
                          </span>
                        )}
                        <DurationBar minutes={entry.task.estimatedDuration} />
                        <span
                          data-figures
                          className={
                            overdue
                              ? "ml-auto shrink-0 text-sm font-medium text-attention sm:ml-0 sm:w-24 sm:text-right"
                              : "ml-auto shrink-0 text-sm sm:ml-0 sm:w-24 sm:text-right"
                          }
                        >
                          {dueLabel(entry.factors.daysUntilDue)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section className="flex flex-col items-start gap-4 border-l border-rule pl-5">
          <p className="max-w-[55ch] text-sm text-muted-foreground">
            Nothing open. Add your courses and what&apos;s due, and Mentra will
            work out what deserves the next hour.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/courses"
              className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Add a course
            </Link>
            <Link
              href="/tasks"
              className="rounded-md border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Add work
            </Link>
          </div>
        </section>
      )}
    </AppShell>
  );
}
