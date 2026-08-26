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
    dueDate: z.string().optional(),
    priority: taskPriority.optional(),
    estimatedDuration: z.number().int().nonnegative().optional(),
    type: taskType.optional(),
    courseId: z.string().optional(),
  }),
  update_task: z.object({
    taskId: z.string().min(1),
    title: z.string().optional(),
    dueDate: z.string().optional(),
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
  }),
  search_memory: empty,
  save_memory: z.object({
    content: z.string().min(1),
    type: memoryType,
    source: memorySource.default("inferred"),
  }),
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
      "List the student's courses for the current semester, with code, professor and credits.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_tasks",
    description:
      "List the student's tasks, assignments and exams. Optionally filter by status or course.",
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
      "Create a task, assignment or exam for the student. Only call this when the student asks for something to be added.",
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
      "Search the student's own notes by keyword across title and body. An empty query returns all of them.",
    parameters: {
      type: "object",
      properties: { query: str("Keyword to search for.") },
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
