import { describe, expect, test } from "vitest";
import { TOOL_NAMES, toolDefinitions, validateToolCall } from "@/lib/ai/tools";

describe("validateToolCall — rejecting out-of-scope calls", () => {
  test("rejects a tool name the app does not implement", () => {
    const result = validateToolCall("drop_database", {});

    expect(result).toEqual({ ok: false, error: "Unknown tool: drop_database" });
  });

  test("rejects a call whose arguments are not an object", () => {
    const result = validateToolCall("get_courses", "not json");

    expect(result.ok).toBe(false);
  });

  test("rejects a required argument that is missing", () => {
    const result = validateToolCall("create_task", {});

    expect(result.ok).toBe(false);
  });

  test("rejects an argument of the wrong type", () => {
    const result = validateToolCall("create_task", { title: 42 });

    expect(result.ok).toBe(false);
  });

  test("rejects a value outside the allowed set", () => {
    const result = validateToolCall("create_task", {
      title: "Read chapter 3",
      priority: "URGENT",
    });

    expect(result.ok).toBe(false);
  });

  test("strips an argument the tool does not declare", () => {
    const result = validateToolCall("create_task", {
      title: "Read chapter 3",
      isAdmin: true,
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.args).not.toHaveProperty("isAdmin");
  });
});

describe("validateToolCall — ownership cannot come from the model", () => {
  test.each(TOOL_NAMES)(
    "%s does not accept a userId argument",
    (name) => {
      const definition = toolDefinitions.find((tool) => tool.name === name);
      const properties = definition?.parameters.properties ?? {};

      expect(Object.keys(properties)).not.toContain("userId");
    }
  );

  test("discards a userId the model tries to smuggle in", () => {
    const result = validateToolCall("get_tasks", {
      userId: "someone-elses-id",
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.args).not.toHaveProperty("userId");
  });
});

describe("validateToolCall — accepting good calls", () => {
  test("accepts a tool that takes no arguments", () => {
    const result = validateToolCall("get_courses", {});

    expect(result).toEqual({ ok: true, name: "get_courses", args: {} });
  });

  test("accepts a minimal create_task", () => {
    const result = validateToolCall("create_task", { title: "Read chapter 3" });

    expect(result.ok).toBe(true);
    expect(result.ok && result.name === "create_task" && result.args.title).toBe(
      "Read chapter 3"
    );
  });

  test("accepts a fully specified create_task", () => {
    const result = validateToolCall("create_task", {
      title: "Network Security lab",
      dueDate: "2026-09-03",
      priority: "high",
      estimatedDuration: 90,
      type: "assignment",
    });

    expect(result.ok).toBe(true);
  });

  test("accepts search_notes with a query", () => {
    const result = validateToolCall("search_notes", { query: "subnetting" });

    expect(
      result.ok && result.name === "search_notes" && result.args.query
    ).toBe("subnetting");
  });

  test("accepts save_memory with a type and source", () => {
    const result = validateToolCall("save_memory", {
      content: "Student struggles with subnetting",
      type: "learning_state",
      source: "inferred",
    });

    expect(result.ok).toBe(true);
  });

  test("accepts get_deadlines with an available-minutes hint", () => {
    const result = validateToolCall("get_deadlines", { availableMinutes: 45 });

    expect(
      result.ok && result.name === "get_deadlines" && result.args.availableMinutes
    ).toBe(45);
  });

  test("rejects a negative available-minutes hint", () => {
    const result = validateToolCall("get_deadlines", { availableMinutes: -10 });

    expect(result.ok).toBe(false);
  });
});

describe("toolDefinitions", () => {
  test("exposes exactly the tools the ticket lists", () => {
    expect([...TOOL_NAMES].sort()).toEqual(
      [
        "complete_task",
        "create_task",
        "get_courses",
        "get_deadlines",
        "get_tasks",
        "save_memory",
        "search_memory",
        "search_notes",
        "update_task",
        "create_note",
        "create_course",
        "create_semester",
        "list_semesters",
        "update_note",
        "delete_note",
        "delete_task",
      ].sort()
    );
  });

  test("gives every tool a description the model can route on", () => {
    for (const definition of toolDefinitions) {
      expect(definition.description.length).toBeGreaterThan(20);
    }
  });

  test("has one definition per declared tool name", () => {
    expect(toolDefinitions.map((tool) => tool.name).sort()).toEqual(
      [...TOOL_NAMES].sort()
    );
  });
});

describe("validateToolCall — writing to every surface, not only tasks", () => {
  test("accepts a note with just a title and body", () => {
    const result = validateToolCall("create_note", {
      title: "Insulin timing",
      body: "Rapid-acting goes 15 minutes before meals.",
    });

    expect(result.ok).toBe(true);
  });

  test("accepts a note attached to a piece of work", () => {
    const result = validateToolCall("create_note", {
      title: "Watch the units",
      body: "mg vs mcg is where the mistakes came from.",
      taskId: "task_123",
    });

    expect(
      result.ok && result.name === "create_note" && result.args.taskId
    ).toBe("task_123");
  });

  test("rejects a note with no body, which would file an empty thought", () => {
    const result = validateToolCall("create_note", { title: "Insulin timing" });

    expect(result.ok).toBe(false);
  });

  test("accepts a course under a named term", () => {
    const result = validateToolCall("create_course", {
      name: "Mental Health Nursing",
      code: "NURS 320",
      semesterId: "sem_1",
    });

    expect(result.ok).toBe(true);
  });

  test("rejects a course with no term to sit in", () => {
    const result = validateToolCall("create_course", {
      name: "Mental Health Nursing",
    });

    expect(result.ok).toBe(false);
  });

  test("rejects a course whose credits are not a number", () => {
    const result = validateToolCall("create_course", {
      name: "Mental Health Nursing",
      semesterId: "sem_1",
      credits: "twenty",
    });

    expect(result.ok).toBe(false);
  });

  test("accepts a term with a start and an end", () => {
    const result = validateToolCall("create_semester", {
      name: "Autumn 2026",
      startDate: "2026-09-01",
      endDate: "2026-12-18",
    });

    expect(result.ok).toBe(true);
  });

  test("rejects a term missing its end date", () => {
    const result = validateToolCall("create_semester", {
      name: "Autumn 2026",
      startDate: "2026-09-01",
    });

    expect(result.ok).toBe(false);
  });

  test("accepts list_semesters, which takes no arguments", () => {
    const result = validateToolCall("list_semesters", {});

    expect(result).toEqual({ ok: true, name: "list_semesters", args: {} });
  });
});

describe("validateToolCall — finding notes attached to a piece of work", () => {
  test("accepts search_notes filtered to one task", () => {
    const result = validateToolCall("search_notes", { taskId: "task_123" });

    expect(
      result.ok && result.name === "search_notes" && result.args.taskId
    ).toBe("task_123");
  });

  test("still accepts search_notes with only a query", () => {
    const result = validateToolCall("search_notes", { query: "insulin" });

    expect(result.ok).toBe(true);
  });
});

describe("validateToolCall — correcting what was already filed", () => {
  test("accepts update_note changing the body", () => {
    const result = validateToolCall("update_note", {
      noteId: "note_1",
      body: "The corrected text.",
    });

    expect(result.ok).toBe(true);
  });

  test("accepts update_note re-filing a note onto a piece of work", () => {
    const result = validateToolCall("update_note", {
      noteId: "note_1",
      taskId: "task_9",
    });

    expect(
      result.ok && result.name === "update_note" && result.args.taskId
    ).toBe("task_9");
  });

  test("rejects update_note without saying which note", () => {
    const result = validateToolCall("update_note", { body: "New text." });

    expect(result.ok).toBe(false);
  });

  test("accepts delete_note", () => {
    const result = validateToolCall("delete_note", { noteId: "note_1" });

    expect(result).toEqual({
      ok: true,
      name: "delete_note",
      args: { noteId: "note_1" },
    });
  });

  test("rejects delete_note with no note named", () => {
    expect(validateToolCall("delete_note", {}).ok).toBe(false);
  });

  test("accepts delete_task", () => {
    const result = validateToolCall("delete_task", { taskId: "task_1" });

    expect(result).toEqual({
      ok: true,
      name: "delete_task",
      args: { taskId: "task_1" },
    });
  });

  test("rejects delete_task with an empty id", () => {
    expect(validateToolCall("delete_task", { taskId: "" }).ok).toBe(false);
  });
});
