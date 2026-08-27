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
      const tasks = await listTasksForUser(userId);
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
          dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
          priority: task.priority,
          status: task.status,
          type: task.type,
          estimatedDuration: task.estimatedDuration,
        }));
    }

    case "get_deadlines": {
      const tasks = await listTasksForUser(userId);
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
      const notes = await searchNotesForUser(userId, call.args.query);
      return notes.map((note) => ({
        id: note.id,
        title: note.title,
        body: note.body,
        courseId: note.courseId,
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
