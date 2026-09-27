import type { Metadata } from "next";
import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { getStudentTime } from "@/lib/student-time";
import { listSemestersForUser } from "@/lib/services/semester";
import { listCoursesForUser } from "@/lib/services/course";
import { listMeetingsForUser } from "@/lib/services/meeting";
import { isoWeekday, layoutWeek, pickTerm, termRunsOn } from "@/lib/timetable";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { RunningHead } from "@/components/running-head";
import { WeekGrid } from "@/components/timetable/week-grid";
import { DayList } from "@/components/timetable/day-list";
import { AddMeetingForm } from "@/components/timetable/add-meeting-form";

export const metadata: Metadata = {
  title: "Timetable — Mentra",
};

export default async function TimetablePage({
  searchParams,
}: PageProps<"/timetable">) {
  const userId = await requireUserId();
  const { now } = await getStudentTime();
  const { term: requested } = await searchParams;

  const [semesters, courses, meetings] = await Promise.all([
    listSemestersForUser(userId),
    listCoursesForUser(userId),
    listMeetingsForUser(userId),
  ]);

  const term = pickTerm(
    semesters,
    now,
    typeof requested === "string" ? requested : undefined
  );
  const termCourses = term
    ? courses.filter((course) => course.semesterId === term.id)
    : [];
  const termMeetings = term
    ? meetings.filter((meeting) => meeting.course.semesterId === term.id)
    : [];
  const layout = layoutWeek(termMeetings);
  const todayWeekday = term && termRunsOn(term, now) ? isoWeekday(now) : null;

  const termSwitcher =
    semesters.length > 1 ? (
      <nav aria-label="Terms" className="flex flex-wrap gap-1">
        {semesters.map((semester) => (
          <Link
            key={semester.id}
            href={`/timetable?term=${semester.id}`}
            aria-current={semester.id === term?.id ? "page" : undefined}
            className={cn(
              "rounded-xs px-2.5 py-1 text-xs transition-colors hover:bg-muted",
              semester.id === term?.id && "bg-muted font-medium"
            )}
          >
            {semester.name}
          </Link>
        ))}
      </nav>
    ) : undefined;

  return (
    <AppShell
      title="Timetable"
      lede={term ? `${term.name} · the week, every week of the term.` : "The week, once you have a term."}
      actions={termSwitcher}
    >
      {!term && (
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          A timetable hangs off a term and its courses.{" "}
          <Link href="/courses" className="underline underline-offset-4">
            Add them on Courses
          </Link>{" "}
          first.
        </p>
      )}

      {term && termMeetings.length === 0 && (
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          No class times in {term.name} yet. Add them below, or open a course on
          Courses.
        </p>
      )}

      {termMeetings.length > 0 && (
        <section aria-label={`${term?.name} week`} className="flex flex-col gap-4">
          <WeekGrid layout={layout} todayWeekday={todayWeekday} />
          <DayList layout={layout} todayWeekday={todayWeekday} />
        </section>
      )}

      {termCourses.length > 0 && (
        <section className="flex flex-col gap-4">
          <RunningHead>Add a class time</RunningHead>
          <AddMeetingForm
            idPrefix="timetable-meeting"
            courses={termCourses.map(({ id, name }) => ({ id, name }))}
          />
        </section>
      )}
    </AppShell>
  );
}
