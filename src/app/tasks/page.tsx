import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { getStudentTime } from "@/lib/student-time";
import { AppShell } from "@/components/app-shell";
import { RunningHead } from "@/components/running-head";
import { listTasksForUser } from "@/lib/services/task";
import { listCoursesForUser } from "@/lib/services/course";
import { listNotesForUser } from "@/lib/services/note";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { TaskRow } from "@/components/tasks/task-row";

export const metadata: Metadata = {
  title: "Work — Mentra",
};

export default async function TasksPage() {
  const userId = await requireUserId();
  const { now } = await getStudentTime();
  const [tasks, courses, notes] = await Promise.all([
    listTasksForUser(userId),
    listCoursesForUser(userId),
    listNotesForUser(userId),
  ]);

  // The notes hanging off each piece of work, so a row can show what you
  // already wrote about it without a second trip to the notes page.
  const notesByTaskId = new Map<string, typeof notes>();
  for (const note of notes) {
    if (!note.taskId) continue;
    const existing = notesByTaskId.get(note.taskId);
    if (existing) existing.push(note);
    else notesByTaskId.set(note.taskId, [note]);
  }

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
        <section className="flex flex-col gap-4">
          <RunningHead>Filed work</RunningHead>
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
                notes={notesByTaskId.get(task.id) ?? []}
                courses={courseOptions}
                today={now}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <RunningHead>Add work</RunningHead>
        <CreateTaskForm courses={courseOptions} />
      </section>
    </AppShell>
  );
}
