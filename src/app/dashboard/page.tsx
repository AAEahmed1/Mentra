import type { Metadata } from "next";
import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { greetingForHour } from "@/lib/greeting";
import { listTasksForUser } from "@/lib/services/task";
import { listCoursesForUser } from "@/lib/services/course";
import { listNotesForUser } from "@/lib/services/note";
import { rankTasks, type RankedTask } from "@/lib/recommendations";
import { explainRecommendation } from "@/lib/recommendation-reason";
import { TermScore } from "@/components/term-score";
import { DurationBar } from "@/components/duration-bar";
import { TimeAvailable } from "@/components/time-available";
import { RunningHead } from "@/components/running-head";
import { StateLamp } from "@/components/state-lamp";
import { parseAvailableMinutes } from "@/lib/available-minutes";

export const metadata: Metadata = {
  title: "Today — Mentra",
};

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

/** How many entries are listed under today's before the table is cut off. */
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

/** The decisive figure and the words for it, as they read on the band. */
function countdown(entry: RankedTask): { figure: string; word: string } {
  const { daysUntilDue } = entry.factors;
  if (daysUntilDue === null) return { figure: "—", word: "no date" };
  if (daysUntilDue < 0)
    return {
      figure: String(Math.abs(daysUntilDue)),
      word: Math.abs(daysUntilDue) === 1 ? "day over" : "days over",
    };
  if (daysUntilDue === 0) return { figure: "0", word: "due today" };
  return {
    figure: String(daysUntilDue),
    word: daysUntilDue === 1 ? "day left" : "days left",
  };
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const userId = await requireUserId();
  const now = new Date();

  const { minutes } = await searchParams;
  const availableMinutes = parseAvailableMinutes(minutes);

  const [user, tasks, courses, notes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, program: true },
    }),
    listTasksForUser(userId),
    listCoursesForUser(userId),
    listNotesForUser(userId),
  ]);

  const courseById = new Map(courses.map((course) => [course.id, course]));

  // How many notes hang off each piece of work, for the table's hover detail.
  const noteCountByTaskId = new Map<string, number>();
  for (const note of notes) {
    if (note.taskId) {
      noteCountByTaskId.set(
        note.taskId,
        (noteCountByTaskId.get(note.taskId) ?? 0) + 1
      );
    }
  }
  const ranked = rankTasks(tasks, { now, availableMinutes });
  const [struck, ...rest] = ranked;
  const lanes = rest.slice(0, LANE_LIMIT);

  const dueThisWeek = ranked.filter(
    (entry) =>
      entry.factors.daysUntilDue !== null && entry.factors.daysUntilDue <= 7
  ).length;

  const struckCourse = struck?.task.courseId
    ? (courseById.get(struck.task.courseId) ?? null)
    : null;

  const struckOverdue = struck?.factors.urgency === "overdue";
  const struckFigures = struck ? countdown(struck) : null;

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
          noteCountByTaskId={noteCountByTaskId}
          now={now}
        />
      )}

      {struck && struckFigures ? (
        <section aria-labelledby="now-heading" className="flex flex-col gap-5">
          <RunningHead
            id="now-heading"
            tone="now"
            trailing={<TimeAvailable selected={availableMinutes} />}
          >
            Now
          </RunningHead>

          {/*
            Today's entry. The one place in the system where ink owns a whole
            region rather than marking an edge: a solid band across the measure
            carrying the state in reversed type, printed in whichever plate the
            state belongs to — green while it is live, oxblood once it has
            slipped. The entry itself is set on the open stock beneath it, not
            in a box: this is a printed notice, not a card.
          */}
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
                  {struckFigures.figure}
                </span>
                <span className="text-[0.6875rem] font-semibold tracking-[0.16em] uppercase">
                  {struckFigures.word}
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
                    {struckCourse.name}
                  </span>
                )}
                <DurationBar minutes={struck.task.estimatedDuration} />
              </div>

              {/* The marking: why this entry, in the edition's margin voice. */}
              <p className="mt-5 max-w-[65ch] border-l border-rule pl-3 text-sm text-muted-foreground italic">
                {explainRecommendation(struck.factors)}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/tasks"
                  className="rounded-xs bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Open my work
                </Link>
                <Link
                  href="/notes"
                  className="rounded-xs border border-rule-strong px-3.5 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Write a note
                </Link>
              </div>
            </div>
          </article>

          {lanes.length > 0 && (
            <div className="mt-3 flex flex-col gap-4">
              <RunningHead>After that</RunningHead>

              {/*
                Fixed columns that never move, and a lamp column one glyph wide
                at the head of every line — a row changes state inside its own
                cells rather than by breaking the grid.
              */}
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
                  {lanes.map((entry) => {
                    const course = entry.task.courseId
                      ? (courseById.get(entry.task.courseId) ?? null)
                      : null;
                    const overdue = entry.factors.urgency === "overdue";
                    const today = entry.factors.daysUntilDue === 0;

                    return (
                      <tr key={entry.task.id}>
                        <td>
                          <StateLamp
                            state={
                              overdue ? "over" : today ? "today" : "on-track"
                            }
                          />
                        </td>
                        <td className="pr-4 text-sm">
                          {entry.task.title}
                          {/* Priority is what put a distant entry above a
                              nearer one; say so, or the order looks arbitrary. */}
                          {entry.factors.priority !== "medium" && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {entry.factors.priority} priority
                            </span>
                          )}
                          <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                            {course?.name}
                          </span>
                        </td>
                        <td className="hidden pr-4 text-xs text-muted-foreground sm:table-cell">
                          {course?.name}
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
            </div>
          )}
        </section>
      ) : (
        <section className="flex flex-col items-start gap-4">
          <RunningHead>Now</RunningHead>
          <p className="max-w-[55ch] text-sm text-muted-foreground">
            Nothing open. Add your courses and what&apos;s due, and Mentra will
            work out what deserves the next hour.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/courses"
              className="rounded-xs bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Add a course
            </Link>
            <Link
              href="/tasks"
              className="rounded-xs border border-rule-strong px-3.5 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Add work
            </Link>
          </div>
        </section>
      )}
    </AppShell>
  );
}
