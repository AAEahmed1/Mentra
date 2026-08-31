import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { RunningHead } from "@/components/running-head";
import { listSemestersForUser } from "@/lib/services/semester";
import { listCoursesForSemester } from "@/lib/services/course";
import { CreateSemesterForm } from "@/components/courses/create-semester-form";
import { CreateCourseForm } from "@/components/courses/create-course-form";
import { DeleteSemesterButton } from "@/components/courses/delete-semester-button";
import { CourseRow } from "@/components/courses/course-row";

export const metadata: Metadata = {
  title: "Courses — Mentra",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function CoursesPage() {
  const userId = await requireUserId();
  const semesters = await listSemestersForUser(userId);
  const semestersWithCourses = await Promise.all(
    semesters.map(async (semester) => ({
      semester,
      courses: await listCoursesForSemester(userId, semester.id),
    }))
  );

  return (
    <AppShell
      title="Courses"
      lede="A term, and the courses running through it."
    >
      {semestersWithCourses.map(({ semester, courses }) => (
        <section key={semester.id} className="flex flex-col gap-4">
          <div className="group/term flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-2 border-rule-strong pb-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-[-0.015em]">
                {semester.name}
              </h2>
              <p data-figures className="mt-0.5 text-xs text-muted-foreground">
                {dateFormatter.format(semester.startDate)} –{" "}
                {dateFormatter.format(semester.endDate)}
              </p>
            </div>
            <DeleteSemesterButton semesterId={semester.id} />
          </div>

          {courses.length > 0 && (
            <ul className="flex flex-col">
              {courses.map((course) => (
                <CourseRow key={course.id} course={course} />
              ))}
            </ul>
          )}

          <CreateCourseForm semesterId={semester.id} />
        </section>
      ))}

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
