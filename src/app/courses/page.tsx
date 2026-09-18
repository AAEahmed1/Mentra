import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { getStudentTime } from "@/lib/student-time";
import { calendarDaysUntil } from "@/lib/task-status";
import { parseCourseSort, sortCourses } from "@/lib/course-sort";
import { AppShell } from "@/components/app-shell";
import { RunningHead } from "@/components/running-head";
import { listSemestersForUser } from "@/lib/services/semester";
import { listCoursesForSemester } from "@/lib/services/course";
import { CreateSemesterForm } from "@/components/courses/create-semester-form";
import { CreateCourseForm } from "@/components/courses/create-course-form";
import { DeleteSemesterButton } from "@/components/courses/delete-semester-button";
import { CourseRow } from "@/components/courses/course-row";
import { CourseSortControl } from "@/components/courses/course-sort-control";

export const metadata: Metadata = {
  title: "Courses — Mentra",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function CoursesPage({
  searchParams,
}: PageProps<"/courses">) {
  const userId = await requireUserId();
  const { now } = await getStudentTime();
  const sort = parseCourseSort((await searchParams).sort);

  const semesters = await listSemestersForUser(userId);
  const semestersWithCourses = await Promise.all(
    semesters.map(async (semester) => ({
      semester,
      courses: sortCourses(
        await listCoursesForSemester(userId, semester.id),
        sort
      ),
    }))
  );
  const anyCourses = semestersWithCourses.some(
    ({ courses }) => courses.length > 0
  );

  return (
    <AppShell
      title="Courses"
      lede="A term, and the courses running through it."
      actions={anyCourses ? <CourseSortControl selected={sort} /> : undefined}
    >
      {semestersWithCourses.map(({ semester, courses }) => {
        const totalCredits = courses.reduce(
          (sum, course) => sum + (course.credits ?? 0),
          0
        );
        // A term that has finished starts folded away, so the one being
        // lived in is what the page opens on. Any term can still be opened.
        const hasEnded = calendarDaysUntil(semester.endDate, now) < 0;

        return (
          <details
            key={semester.id}
            open={!hasEnded}
            className="group/term"
          >
            {/*
              The whole heading is the toggle. The course count and credits
              sit in it so a folded term still says what is inside.
            */}
            <summary className="flex cursor-pointer list-none items-baseline gap-3 border-b-2 border-rule-strong pb-3 select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <svg
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-3.5 shrink-0 self-center text-muted-foreground transition-transform group-open/term:rotate-90"
              >
                <polyline points="4.5,2.5 8,6 4.5,9.5" />
              </svg>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-semibold tracking-[-0.015em]">
                  {semester.name}
                </h2>
                <p data-figures className="mt-0.5 text-xs text-muted-foreground">
                  {dateFormatter.format(semester.startDate)} –{" "}
                  {dateFormatter.format(semester.endDate)}
                  {" · "}
                  {courses.length} course{courses.length === 1 ? "" : "s"}
                  {totalCredits > 0 && ` · ${totalCredits} credits`}
                </p>
              </div>
            </summary>

            <div className="mt-4 flex flex-col gap-4">
              {courses.length > 0 && (
                <ul className="flex flex-col">
                  {courses.map((course) => (
                    <CourseRow key={course.id} course={course} />
                  ))}
                </ul>
              )}

              <CreateCourseForm semesterId={semester.id} />

              {/*
                Deleting a term is refused while it has courses, so it sits
                after them rather than in the heading, where it would share a
                row with the toggle.
              */}
              <div className="flex justify-end">
                <DeleteSemesterButton semesterId={semester.id} />
              </div>
            </div>
          </details>
        );
      })}

      {semestersWithCourses.length === 0 && (
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          Start with the term you&apos;re in. Once it exists you can add the
          courses running through it, and everything else hangs off those.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <RunningHead>Add a term</RunningHead>
        <CreateSemesterForm />
      </section>
    </AppShell>
  );
}
