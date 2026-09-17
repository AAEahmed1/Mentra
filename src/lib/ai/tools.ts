import { z } from "zod";

/**
 * The tools the assistant is allowed to request.
 *
 * Two rules hold across every entry, and both are enforced by tests:
 *
 * 1. No tool takes a `userId`. Ownership comes from the session on the server,
 *    never from the model, so a confused or manipulated model cannot reach
 *    another student's data by naming their id.
 * 2. Arguments are parsed with zod before anything runs. The model proposes;
 *    the app validates and executes (plan.md §19).
 */

const taskType = z.enum(["task", "assignment", "exam"]);
const taskPriority = z.enum(["low", "medium", "high"]);
const taskStatus = z.enum([
  "not_started",
  "in_progress",
  "paused",
  "completed",
  "cancelled",
]);
const memoryType = z.enum([
  "profile",
  "commitment",
  "learning_state",
  "behavioral",
]);
const memorySource = z.enum(["explicit", "inferred"]);

const empty = z.object({});

/** True for a YYYY-MM-DD string naming a day that exists on the calendar. */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  // An impossible day such as 2026-02-30 rolls over into March rather than
  // failing, so it only counts if it reads back as what was written.
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/**
 * A calendar date the model wrote. Checked here rather than left to `new Date`
 * in execute.ts, where a bad one throws and reaches the model as "That lookup
 * failed" — which tells it nothing it can correct.
 */
const calendarDate = z
  .string()
  // abort: a date in the wrong shape needs one message, not two.
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    error: "must be a date written as YYYY-MM-DD",
    abort: true,
  })
  .refine(isCalendarDate, "is not a real calendar date");

const toolSchemas = {
  get_courses: empty,
  get_tasks: z.object({
    status: taskStatus.optional(),
    courseId: z.string().optional(),
  }),
  get_deadlines: z.object({
    availableMinutes: z.number().int().nonnegative().optional(),
  }),
  create_task: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    dueDate: calendarDate.optional(),
    priority: taskPriority.optional(),
    estimatedDuration: z.number().int().nonnegative().optional(),
    type: taskType.optional(),
    courseId: z.string().optional(),
  }),
  update_task: z.object({
    taskId: z.string().min(1),
    title: z.string().min(1).optional(),
    dueDate: calendarDate.optional(),
    priority: taskPriority.optional(),
    estimatedDuration: z.number().int().nonnegative().optional(),
    status: taskStatus.optional(),
  }),
  complete_task: z.object({
    taskId: z.string().min(1),
    actualDuration: z.number().int().nonnegative().optional(),
  }),
  search_notes: z.object({
    query: z.string().default(""),
    taskId: z.string().optional(),
  }),
  search_memory: empty,
  save_memory: z.object({
    content: z.string().min(1),
    type: memoryType,
    source: memorySource.default("inferred"),
  }),
  update_note: z.object({
    noteId: z.string().min(1),
    title: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    courseId: z.string().optional(),
    taskId: z.string().optional(),
  }),
  delete_note: z.object({
    noteId: z.string().min(1),
  }),
  delete_task: z.object({
    taskId: z.string().min(1),
  }),
  create_note: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    courseId: z.string().optional(),
    taskId: z.string().optional(),
  }),
  create_course: z.object({
    semesterId: z.string().min(1),
    name: z.string().min(1),
    code: z.string().optional(),
    professor: z.string().optional(),
    credits: z.number().int().nonnegative().optional(),
  }),
  create_semester: z
    .object({
      name: z.string().min(1),
      startDate: calendarDate,
      endDate: calendarDate,
    })
    // Both are YYYY-MM-DD by now, so comparing the strings compares the days.
    .refine((term) => term.endDate > term.startDate, {
      message: "must be after startDate",
      path: ["endDate"],
    }),
  list_semesters: empty,
} as const;

export type ToolName = keyof typeof toolSchemas;

export const TOOL_NAMES = Object.keys(toolSchemas) as ToolName[];

type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties: false;
};

export type ToolDefinition = {
  name: ToolName;
  description: string;
  parameters: JsonSchema;
};

const str = (description: string) => ({ type: "string", description });
const int = (description: string) => ({ type: "integer", description });
const enumOf = (values: readonly string[], description: string) => ({
  type: "string",
  enum: [...values],
  description,
});

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "get_courses",
    description:
      "List every course the student has, across all of their terms, with code, professor, credits and the term each one runs in.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_tasks",
    description:
      "List the student's tasks, assignments and exams, newest first. Optionally filter by status or course. Long lists are cut short, and the result says so; filter to see the rest.",
    parameters: {
      type: "object",
      properties: {
        status: enumOf(taskStatus.options, "Only tasks in this status."),
        courseId: str("Only tasks for this course id."),
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_deadlines",
    description:
      "Get the student's open work ranked by what deserves attention first, each with the factors behind its placement. Use this to answer what to work on, and cite these factors when asked why.",
    parameters: {
      type: "object",
      properties: {
        availableMinutes: int(
          "How many minutes the student says they have right now, if they said."
        ),
      },
      additionalProperties: false,
    },
  },
  {
    name: "create_task",
    description:
      "Create a task, assignment or exam for the student. Call this when they ask for one, and also when they mention a piece of work in passing, then say what you recorded. Fill in only the details they gave.",
    parameters: {
      type: "object",
      properties: {
        title: str("What the task is called."),
        description: str("Optional longer detail."),
        dueDate: str("Due date as YYYY-MM-DD."),
        priority: enumOf(taskPriority.options, "Defaults to medium."),
        estimatedDuration: int("Estimated minutes of work."),
        type: enumOf(taskType.options, "Defaults to task."),
        courseId: str("Course id to file it under, if it belongs to one."),
      },
      required: ["title"],
      additionalProperties: false,
    },
  },
  {
    name: "update_task",
    description:
      "Change an existing task's details or status. Get the task id from get_tasks or get_deadlines first.",
    parameters: {
      type: "object",
      properties: {
        taskId: str("The id of the task to change."),
        title: str("New title."),
        dueDate: str("New due date as YYYY-MM-DD."),
        priority: enumOf(taskPriority.options, "New priority."),
        estimatedDuration: int("New estimate in minutes."),
        status: enumOf(taskStatus.options, "New status."),
      },
      required: ["taskId"],
      additionalProperties: false,
    },
  },
  {
    name: "complete_task",
    description:
      "Mark a task finished, optionally recording how long it actually took.",
    parameters: {
      type: "object",
      properties: {
        taskId: str("The id of the task to complete."),
        actualDuration: int(
          "How many minutes it actually took, if the student said."
        ),
      },
      required: ["taskId"],
      additionalProperties: false,
    },
  },
  {
    name: "search_notes",
    description:
      "Read the student's notes. Pass taskId to get exactly the notes attached to one piece of work — use this to answer whether something has notes. Pass a query to search title and body by keyword. With neither, returns the newest. At most 20 notes come back, and very long bodies are shortened; the result says when either happened.",
    parameters: {
      type: "object",
      properties: {
        query: str("Keyword to search for."),
        taskId: str("Only notes attached to this piece of work."),
      },
      additionalProperties: false,
    },
  },
  {
    name: "search_memory",
    description:
      "Read what Mentra already knows about this student — their profile, commitments, learning state and habits.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "save_memory",
    description:
      "Record something durable learned about the student. Use source 'explicit' only when they stated it themselves, 'inferred' when you concluded it.",
    parameters: {
      type: "object",
      properties: {
        content: str("The fact, in one plain sentence about the student."),
        type: enumOf(memoryType.options, "Which kind of memory this is."),
        source: enumOf(
          memorySource.options,
          "Whether the student said it or you inferred it."
        ),
      },
      required: ["content", "type"],
      additionalProperties: false,
    },
  },
  {
    name: "create_note",
    description:
      "Write a note into the student's own notes. Optionally file it under a course, or attach it to the specific piece of work it is about.",
    parameters: {
      type: "object",
      properties: {
        title: str("A short name for the note."),
        body: str("The note itself, in the student's own terms."),
        courseId: str("Course id to file it under, if it belongs to one."),
        taskId: str("Task id this note is about, if it is about one."),
      },
      required: ["title", "body"],
      additionalProperties: false,
    },
  },
  {
    name: "update_note",
    description:
      "Correct a note that is already written: its title, its body, or the course and piece of work it is filed under. Only what you name changes. Get the id from search_notes first. If search_notes marked the body as shortened, do not replace the body: you have not seen all of it.",
    parameters: {
      type: "object",
      properties: {
        noteId: str("The id of the note to correct."),
        title: str("New title."),
        body: str("New body, replacing what is there."),
        courseId: str("Course id to re-file it under."),
        taskId: str("Task id to attach it to instead."),
      },
      required: ["noteId"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_note",
    description:
      "Delete a note for good. Use this to undo a note that should not have been written. Ask the student first unless they told you to remove it.",
    parameters: {
      type: "object",
      properties: { noteId: str("The id of the note to delete.") },
      required: ["noteId"],
      additionalProperties: false,
    },
  },
  {
    name: "delete_task",
    description:
      "Delete a piece of work for good, along with nothing else — notes written against it survive. Use this to undo work that should not have been created; to record work as finished use complete_task instead. Ask the student first unless they told you to remove it.",
    parameters: {
      type: "object",
      properties: { taskId: str("The id of the work to delete.") },
      required: ["taskId"],
      additionalProperties: false,
    },
  },
  {
    name: "list_semesters",
    description:
      "List the student's terms with their ids and dates. Call this before creating a course, to find the term it belongs in.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "create_course",
    description:
      "Add a course to one of the student's terms. Get the term id from list_semesters first.",
    parameters: {
      type: "object",
      properties: {
        semesterId: str("The term this course runs in."),
        name: str("What the course is called."),
        code: str("Course code, such as NURS 302."),
        professor: str("Who teaches it."),
        credits: int("Credit value."),
      },
      required: ["semesterId", "name"],
      additionalProperties: false,
    },
  },
  {
    name: "create_semester",
    description:
      "Add a term for the student. Dates are YYYY-MM-DD. Only do this when no suitable term exists.",
    parameters: {
      type: "object",
      properties: {
        name: str("What the term is called, such as Autumn 2026."),
        startDate: str("When it starts, as YYYY-MM-DD."),
        endDate: str("When it ends, as YYYY-MM-DD."),
      },
      required: ["name", "startDate", "endDate"],
      additionalProperties: false,
    },
  },
];

export type ValidatedToolCall = {
  [K in ToolName]: { ok: true; name: K; args: z.infer<(typeof toolSchemas)[K]> };
}[ToolName];

export type ToolValidationResult =
  | ValidatedToolCall
  | { ok: false; error: string };

function isToolName(name: string): name is ToolName {
  return Object.prototype.hasOwnProperty.call(toolSchemas, name);
}

/**
 * Validates a tool call the model asked for, before anything touches the
 * database. Unknown tools and malformed arguments are refused; undeclared
 * arguments (including any `userId`) are stripped rather than passed through.
 */
export function validateToolCall(
  name: string,
  rawArgs: unknown
): ToolValidationResult {
  if (!isToolName(name)) {
    return { ok: false, error: `Unknown tool: ${name}` };
  }

  if (
    rawArgs === null ||
    typeof rawArgs !== "object" ||
    Array.isArray(rawArgs)
  ) {
    return { ok: false, error: `Arguments for ${name} must be an object` };
  }

  const parsed = toolSchemas[name].safeParse(rawArgs);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    return { ok: false, error: `Invalid arguments for ${name} — ${detail}` };
  }

  return { ok: true, name, args: parsed.data } as ValidatedToolCall;
}
