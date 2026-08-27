import {
  createTask,
  completeTask,
  listTasksForUser,
  updateTask,
} from "@/lib/services/task";
import { createCourse, listCoursesForUser } from "@/lib/services/course";
import { createSemester, listSemestersForUser } from "@/lib/services/semester";
import { createNote, searchNotesForUser } from "@/lib/services/note";
import { createMemory, listMemoriesForUser } from "@/lib/services/memory";
import { rankTasks } from "@/lib/recommendations";
import { explainRecommendation } from "@/lib/recommendation-reason";
import type { ValidatedToolCall } from "@/lib/ai/tools";

/**
 * Runs a tool call the model requested, always scoped to the signed-in user.
 *
 * `userId` is a parameter here and never part of the tool arguments, so the
 * model cannot choose whose data it reads. Every branch delegates to the
 * services from tickets 02-06, which already enforce ownership themselves.
 */
export async function executeToolCall(
  userId: string,
  call: ValidatedToolCall,
  now: Date = new Date()
): Promise<unknown> {
  /**
   * Course names, keyed by id. Tool results carry the name as well as the id:
   * handing the model a bare foreign key makes it either join the tables in
   * its head or admit it cannot name the course.
   */
  const courseNames = async () =>
    new Map(
      (await listCoursesForUser(userId)).map((course) => [
        course.id,
        course.name,
      ])
    );

  switch (call.name) {
    case "get_courses": {
      const courses = await listCoursesForUser(userId);
      return courses.map((course) => ({
        id: course.id,
        name: course.name,
        code: course.code,
        professor: course.professor,
        credits: course.credits,
      }));
    }

    case "get_tasks": {
      const [tasks, names] = await Promise.all([
        listTasksForUser(userId),
        courseNames(),
      ]);
      return tasks
        .filter((task) =>
          call.args.status ? task.status === call.args.status : true
        )
        .filter((task) =>
          call.args.courseId ? task.courseId === call.args.courseId : true
        )
        .map((task) => ({
          id: task.id,
          title: task.title,
          courseId: task.courseId,
          courseName: task.courseId
            ? (names.get(task.courseId) ?? null)
            : null,
          dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
          priority: task.priority,
          status: task.status,
          type: task.type,
          estimatedDuration: task.estimatedDuration,
        }));
    }

    case "get_deadlines": {
      const [tasks, names] = await Promise.all([
        listTasksForUser(userId),
        courseNames(),
      ]);
      const ranked = rankTasks(tasks, {
        now,
        availableMinutes: call.args.availableMinutes,
      });

      // Hand the model the same factors and wording the dashboard shows, so
      // "why?" is answered from what actually ranked the task rather than
      // from the model's own guess (plan.md §20, §29).
      return ranked.map((entry, index) => ({
        rank: index + 1,
        id: entry.task.id,
        title: entry.task.title,
        courseName: entry.task.courseId
          ? (names.get(entry.task.courseId) ?? null)
          : null,
        dueDate: entry.task.dueDate?.toISOString().slice(0, 10) ?? null,
        estimatedDuration: entry.task.estimatedDuration,
        factors: entry.factors,
        why: explainRecommendation(entry.factors),
      }));
    }

    case "create_task": {
      const result = await createTask(userId, {
        title: call.args.title,
        description: call.args.description,
        dueDate: call.args.dueDate ? new Date(call.args.dueDate) : undefined,
        priority: call.args.priority ?? "medium",
        estimatedDuration: call.args.estimatedDuration,
        type: call.args.type ?? "task",
        topicsToReview: undefined,
        courseId: call.args.courseId,
      });

      return result.success
        ? { created: true, id: result.data.id, title: result.data.title }
        : { created: false, error: "That course does not exist." };
    }

    case "update_task": {
      const { taskId, dueDate, ...rest } = call.args;
      const result = await updateTask(userId, taskId, {
        ...rest,
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      });

      return result.success
        ? { updated: true, id: result.data.id, status: result.data.status }
        : { updated: false, error: "That task does not exist." };
    }

    case "complete_task": {
      const result = await completeTask(
        userId,
        call.args.taskId,
        call.args.actualDuration
      );

      return result.success
        ? { completed: true, id: result.data.id }
        : { completed: false, error: "That task does not exist." };
    }

    case "search_notes": {
      const [found, names] = await Promise.all([
        searchNotesForUser(userId, call.args.query),
        courseNames(),
      ]);

      // Filtering here rather than in the query keeps keyword search and
      // "notes on this work" as one tool the model cannot pick wrongly.
      const notes = call.args.taskId
        ? found.filter((note) => note.taskId === call.args.taskId)
        : found;

      return notes.map((note) => ({
        id: note.id,
        title: note.title,
        body: note.body,
        courseId: note.courseId,
        courseName: note.courseId ? (names.get(note.courseId) ?? null) : null,
        // Without this the assistant can see notes but never what they hang
        // off, so it answers "no notes" to work that plainly has some.
        taskId: note.taskId,
      }));
    }

    case "search_memory": {
      const memories = await listMemoriesForUser(userId);
      return memories.map((memory) => ({
        id: memory.id,
        content: memory.content,
        type: memory.type,
        source: memory.source,
      }));
    }

    case "create_note": {
      const result = await createNote(userId, {
        title: call.args.title,
        body: call.args.body,
        courseId: call.args.courseId,
        taskId: call.args.taskId,
      });

      return result.success
        ? { created: true, id: result.data.id, title: result.data.title }
        : {
            created: false,
            error:
              result.error === "course_not_found"
                ? "That course does not exist."
                : "That piece of work does not exist.",
          };
    }

    case "list_semesters": {
      const semesters = await listSemestersForUser(userId);
      return semesters.map((semester) => ({
        id: semester.id,
        name: semester.name,
        startDate: semester.startDate.toISOString().slice(0, 10),
        endDate: semester.endDate.toISOString().slice(0, 10),
      }));
    }

    case "create_course": {
      const result = await createCourse(userId, call.args.semesterId, {
        name: call.args.name,
        code: call.args.code,
        professor: call.args.professor,
        credits: call.args.credits,
      });

      return result.success
        ? { created: true, id: result.data.id, name: result.data.name }
        : { created: false, error: "That term does not exist." };
    }

    case "create_semester": {
      const semester = await createSemester(userId, {
        name: call.args.name,
        startDate: new Date(call.args.startDate),
        endDate: new Date(call.args.endDate),
      });

      return { created: true, id: semester.id, name: semester.name };
    }

    case "save_memory": {
      const memory = await createMemory(userId, {
        content: call.args.content,
        type: call.args.type,
        source: call.args.source ?? "inferred",
      });
      return { saved: true, id: memory.id };
    }
  }
}
