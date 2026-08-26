import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { listTasksForUser } from "@/lib/services/task";
import { listCoursesForUser } from "@/lib/services/course";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { TaskRow } from "@/components/tasks/task-row";

export const metadata: Metadata = {
  title: "Work — Mentra",
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
    <AppShell
      title="Work"
      lede="Everything due — tasks, assignments and exams, on a course line or on their own."
    >
      {tasks.length > 0 && (
        <ul className="flex flex-col">
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
      )}

      <section className="flex flex-col gap-4 border-t border-rule pt-6">
        <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Add work
        </h2>
        <CreateTaskForm courses={courseOptions} />
      </section>
    </AppShell>
  );
}
