import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { listSemestersForUser } from "@/lib/services/semester";
import { listCoursesForSemester } from "@/lib/services/course";
import { CreateSemesterForm } from "@/components/courses/create-semester-form";
import { CreateCourseForm } from "@/components/courses/create-course-form";
import { DeleteSemesterButton } from "@/components/courses/delete-semester-button";
import { CourseRow } from "@/components/courses/course-row";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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
    <div className="min-h-svh bg-background">
      <AppHeader current="/courses" />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-balance">
            Courses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            File a semester, then add the courses inside it.
          </p>
        </div>

        {semestersWithCourses.map(({ semester, courses }) => (
          <Card key={semester.id}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div
                  aria-hidden="true"
                  className="mt-1 flex shrink-0 flex-col gap-1.5 opacity-40"
                >
                  <span className="size-1 rounded-full bg-foreground" />
                  <span className="size-1 rounded-full bg-foreground" />
                  <span className="size-1 rounded-full bg-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg">{semester.name}</CardTitle>
                  <CardDescription className="font-mono text-xs tabular-nums-mono">
                    {dateFormatter.format(semester.startDate)} –{" "}
                    {dateFormatter.format(semester.endDate)}
                  </CardDescription>
                </div>
              </div>
              <CardAction>
                <DeleteSemesterButton semesterId={semester.id} />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {courses.length > 0 && (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {courses.map((course) => (
                    <CourseRow key={course.id} course={course} />
                  ))}
                </ul>
              )}

              <CreateCourseForm semesterId={semester.id} />
            </CardContent>
          </Card>
        ))}

        <div className="rounded-lg border border-dashed border-border p-5">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Add a semester
          </h2>
          <CreateSemesterForm />
        </div>
      </main>
    </div>
  );
}
