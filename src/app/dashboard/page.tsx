import type { Metadata } from "next";
import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { prisma } from "@/lib/prisma";
import { greetingForHour } from "@/lib/greeting";
import { listTasksForUser } from "@/lib/services/task";
import { listCoursesForUser } from "@/lib/services/course";
import { rankTasks } from "@/lib/recommendations";
import { explainRecommendation } from "@/lib/recommendation-reason";
import { indexTabCode } from "@/lib/course-code";

export const metadata: Metadata = {
  title: "Dashboard — Mentra",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** How many filed rows sit under the pulled card before the list is cut off. */
const FILED_LIMIT = 4;

function dueLabel(daysUntilDue: number | null): string | null {
  if (daysUntilDue === null) return null;
  if (daysUntilDue < 0) {
    const days = Math.abs(daysUntilDue);
    return `${days} day${days === 1 ? "" : "s"} overdue`;
  }
  if (daysUntilDue === 0) return "Due today";
  if (daysUntilDue === 1) return "Due tomorrow";
  return `Due in ${daysUntilDue} days`;
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
  const [top, ...rest] = ranked;
  const filed = rest.slice(0, FILED_LIMIT);

  const greeting = greetingForHour(now.getHours());
  const dueThisWeek = ranked.filter(
    (entry) =>
      entry.factors.daysUntilDue !== null && entry.factors.daysUntilDue <= 7
  ).length;

  const topCourse = top?.task.courseId
    ? (courseById.get(top.task.courseId) ?? null)
    : null;
  const topTab = indexTabCode(topCourse);

  return (
    <div className="min-h-svh bg-background">
      <AppHeader current="/dashboard" />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-balance">
            {greeting}, {user?.name}.
          </h1>
          <p className="mt-1 font-mono text-xs tabular-nums-mono text-muted-foreground">
            {[
              user?.program,
              `${courses.length} course${courses.length === 1 ? "" : "s"}`,
              `${ranked.length} open`,
              dueThisWeek > 0 ? `${dueThisWeek} due this week` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <section aria-labelledby="recommended-heading" className="relative">
          <h2
            id="recommended-heading"
            className="mb-3 text-sm font-medium text-muted-foreground"
          >
            Recommended for tonight
          </h2>

          {top ? (
            <>
              <div className="relative mt-6 pb-6">
                {/* fanned filed cards, peeking behind the pulled card */}
                {filed.length > 0 && (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute top-3 right-2 h-full w-[92%] rotate-[3deg] rounded-lg border border-border bg-card opacity-40"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute top-1.5 right-1 h-full w-[96%] rotate-[1.5deg] rounded-lg border border-border bg-card opacity-60"
                    />
                  </>
                )}

                {/* pulled card — the top recommendation */}
                <div className="animate-pulled-card relative overflow-visible rounded-lg border border-border bg-card shadow-[0_1px_2px_oklch(0_0_0/0.06),0_12px_28px_-10px_oklch(0_0_0/0.22)]">
                  {topTab && (
                    <div className="absolute -top-5 left-6 flex h-5 min-w-12 items-center justify-center rounded-t-md border border-b-0 border-border bg-muted px-1.5 font-mono text-xs font-medium tracking-wide text-muted-foreground">
                      {topTab}
                    </div>
                  )}
                  <div className="flex items-start gap-3 overflow-hidden rounded-lg bg-cardstock px-5 py-5">
                    <div
                      aria-hidden="true"
                      className="mt-1 flex shrink-0 flex-col gap-1.5 opacity-40"
                    >
                      <span className="size-1 rounded-full bg-foreground" />
                      <span className="size-1 rounded-full bg-foreground" />
                      <span className="size-1 rounded-full bg-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-serif text-lg leading-snug font-semibold text-balance">
                          {top.task.title}
                        </h3>
                        {top.factors.urgency === "overdue" ||
                        top.factors.urgency === "due_soon" ? (
                          <span className="shrink-0 whitespace-nowrap rounded-full bg-tab-due px-2.5 py-1 text-xs font-medium text-tab-due-foreground">
                            {dueLabel(top.factors.daysUntilDue)}
                          </span>
                        ) : (
                          <span className="shrink-0 whitespace-nowrap rounded-full bg-tab-ontrack px-2.5 py-1 text-xs font-medium text-tab-ontrack-foreground">
                            On track
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-xs tabular-nums-mono text-muted-foreground">
                        {[
                          topCourse?.name,
                          top.task.estimatedDuration
                            ? `${top.task.estimatedDuration} min`
                            : null,
                          top.task.dueDate
                            ? dateFormatter.format(top.task.dueDate)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No deadline set"}
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {explainRecommendation(top.factors)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {filed.length > 0 && (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {filed.map((entry) => (
                    <li
                      key={entry.task.id}
                      className="flex flex-col gap-1.5 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <span className="text-sm">{entry.task.title}</span>
                      <span className="flex items-center gap-2">
                        <span className="whitespace-nowrap font-mono text-xs tabular-nums-mono text-muted-foreground">
                          {dueLabel(entry.factors.daysUntilDue) ??
                            "No deadline"}
                        </span>
                        <span
                          className={
                            entry.factors.urgency === "overdue" ||
                            entry.factors.urgency === "due_soon"
                              ? "whitespace-nowrap rounded-full bg-tab-due px-2 py-0.5 text-xs font-medium text-tab-due-foreground"
                              : "whitespace-nowrap rounded-full bg-tab-ontrack px-2 py-0.5 text-xs font-medium text-tab-ontrack-foreground"
                          }
                        >
                          {entry.factors.urgency === "overdue"
                            ? "Overdue"
                            : entry.factors.urgency === "due_soon"
                              ? "Due soon"
                              : "On track"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing open right now. Add a task and Mentra will work out what
              deserves your attention first.
            </p>
          )}
        </section>

        <section aria-labelledby="quick-actions-heading">
          <h2
            id="quick-actions-heading"
            className="mb-3 text-sm font-medium text-muted-foreground"
          >
            Quick actions
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tasks"
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Add a task
            </Link>
            <Link
              href="/notes"
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Add a note
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
