import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { listTasksForUser } from "@/lib/services/task";
import { listCoursesForUser } from "@/lib/services/course";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { TaskRow } from "@/components/tasks/task-row";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Tasks — Mentra",
};

export default async function TasksPage() {
  const userId = await requireUserId();
  const [tasks, courses] = await Promise.all([
    listTasksForUser(userId),
    listCoursesForUser(userId),
  ]);

  const courseNameById = new Map(courses.map((course) => [course.id, course.name]));
  const courseOptions = courses.map((course) => ({
    id: course.id,
    name: course.name,
  }));

  return (
    <div className="min-h-svh bg-background">
      <AppHeader current="/tasks" />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-balance">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks, assignments, and exams — linked to a course or on their own.
          </p>
        </div>

        {tasks.length > 0 && (
          <Card>
            <CardContent>
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    courseName={
                      task.courseId
                        ? (courseNameById.get(task.courseId) ?? null)
                        : null
                    }
                    courses={courseOptions}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="rounded-lg border border-dashed border-border p-5">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Add a task
          </h2>
          <CreateTaskForm courses={courseOptions} />
        </div>
      </main>
    </div>
  );
}
