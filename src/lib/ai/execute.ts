import {
  createTask,
  completeTask,
  deleteTask,
  listTasksForUser,
  updateTask,
} from "@/lib/services/task";
import { createCourse, listCoursesForUser } from "@/lib/services/course";
import { createSemester, listSemestersForUser } from "@/lib/services/semester";
import {
  createNote,
  deleteNote,
  searchNotesForUser,
  updateNote,
} from "@/lib/services/note";
import {
  createMemory,
  listRecentMemoriesForUser,
} from "@/lib/services/memory";
import { rankTasks } from "@/lib/recommendations";
import { explainRecommendation } from "@/lib/recommendation-reason";
import type { ValidatedToolCall } from "@/lib/ai/tools";

/**
 * Ceilings on what a read tool hands back. Every result is sent to OpenAI and
 * then again with each later round of the turn, so a student with years of
 * notes would otherwise make every lookup slower and dearer than the last.
 * When a list is cut short the result says so, and says how to narrow it.
 */
export const MAX_NOTE_RESULTS = 20;
/** Longer bodies are cut and marked; the whole note is on the Notes page. */
export const MAX_NOTE_BODY_LENGTH = 2000;
export const MAX_TASK_RESULTS = 50;
/** Far past the forty in the prompt; search_memory is for the rest of those. */
export const MAX_MEMORY_RESULTS = 200;

/**
 * A capped list, in one shape for every tool that caps: the items, how many
 * there were in all, and — only when some were left out — a sentence telling
 * the model so and what to do about it.
 */
function capped<T>(
  items: T[],
  max: number,
  total: number,
  howToNarrow: string
): { items: T[]; total: number; truncated: boolean; note?: string } {
  const shown = items.slice(0, max);
  if (total <= shown.length) {
    return { items: shown, total, truncated: false };
  }
  return {
    items: shown,
    total,
    truncated: true,
    note: `Showing ${shown.length} of ${total}. ${howToNarrow}`,
  };
}

function shortenBody(body: string): string {
  if (body.length <= MAX_NOTE_BODY_LENGTH) return body;
  return `${body.slice(0, MAX_NOTE_BODY_LENGTH)} [shortened: ${
    body.length - MAX_NOTE_BODY_LENGTH
  } more characters not shown. The whole note is on the Notes page.]`;
}

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
      const [courses, semesters] = await Promise.all([
        listCoursesForUser(userId),
        listSemestersForUser(userId),
      ]);
      // Courses from every term come back, so each carries its term: without
      // it, last year's course reads the same as this year's.
      const terms = new Map(semesters.map((term) => [term.id, term.name]));
      return courses.map((course) => ({
        id: course.id,
        name: course.name,
        code: course.code,
        professor: course.professor,
        credits: course.credits,
        semesterId: course.semesterId,
        semesterName: terms.get(course.semesterId) ?? null,
      }));
    }

    case "get_tasks": {
      const [tasks, names] = await Promise.all([
        listTasksForUser(userId),
        courseNames(),
      ]);
      const matching = tasks
        .filter((task) =>
          call.args.status ? task.status === call.args.status : true
        )
        .filter((task) =>
          call.args.courseId ? task.courseId === call.args.courseId : true
        );

      // Newest first, as the service orders them, so what is cut is the work
      // entered longest ago.
      const { items, ...rest } = capped(
        matching,
        MAX_TASK_RESULTS,
        matching.length,
        "These are the most recently added. Filter by status or courseId to see the rest."
      );

      return {
        tasks: items.map((task) => ({
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
        })),
        ...rest,
      };
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
      // from the model's own guess.
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

      // Newest first, as the service orders them.
      const { items, ...rest } = capped(
        notes,
        MAX_NOTE_RESULTS,
        notes.length,
        "These are the newest. Search with a more specific query, or pass taskId, to find older ones."
      );

      return {
        notes: items.map((note) => ({
          id: note.id,
          title: note.title,
          body: shortenBody(note.body),
          courseId: note.courseId,
          courseName: note.courseId
            ? (names.get(note.courseId) ?? null)
            : null,
          // Without this the assistant can see notes but never what they hang
          // off, so it answers "no notes" to work that plainly has some.
          taskId: note.taskId,
        })),
        ...rest,
      };
    }

    case "search_memory": {
      const { memories, total } = await listRecentMemoriesForUser(
        userId,
        MAX_MEMORY_RESULTS
      );
      const { items, ...rest } = capped(
        memories,
        MAX_MEMORY_RESULTS,
        total,
        "These are the most recent. The rest are on the What Mentra knows page."
      );

      return {
        memories: items.map((memory) => ({
          id: memory.id,
          content: memory.content,
          type: memory.type,
          source: memory.source,
        })),
        ...rest,
      };
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

    case "update_note": {
      const { noteId, ...changes } = call.args;
      const result = await updateNote(userId, noteId, changes);

      return result.success
        ? { updated: true, id: result.data.id, title: result.data.title }
        : {
            updated: false,
            error:
              result.error === "course_not_found"
                ? "That course does not exist."
                : result.error === "task_not_found"
                  ? "That piece of work does not exist."
                  : "That note does not exist.",
          };
    }

    case "delete_note": {
      const result = await deleteNote(userId, call.args.noteId);

      return result.success
        ? { deleted: true }
        : { deleted: false, error: "That note does not exist." };
    }

    case "delete_task": {
      const result = await deleteTask(userId, call.args.taskId);

      return result.success
        ? { deleted: true }
        : { deleted: false, error: "That piece of work does not exist." };
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
