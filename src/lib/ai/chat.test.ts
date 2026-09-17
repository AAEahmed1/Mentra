import { describe, expect, test } from "vitest";
import {
  describeChange,
  runAssistantTurn,
  MAX_TOOL_ROUNDS,
} from "@/lib/ai/chat";
import type { ChatCompleter } from "@/lib/ai/chat";
import { validateToolCall } from "@/lib/ai/tools";

/** A completer that always asks for one more tool call, never finishing. */
const alwaysCallsTool: ChatCompleter = async () => ({
  toolCalls: [{ id: "call_1", name: "get_courses", arguments: "{}" }],
  content: null,
});

const respondsWithText =
  (text: string): ChatCompleter =>
  async () => ({ toolCalls: [], content: text });

describe("runAssistantTurn", () => {
  test("returns the assistant's reply when no tool is needed", async () => {
    const result = await runAssistantTurn({
      messages: [{ role: "user", content: "hello" }],
      complete: respondsWithText("Hi — what are you working on?"),
      executeTool: async () => ({}),
    });

    expect(result.reply).toBe("Hi — what are you working on?");
  });

  test("feeds a tool result back and returns the follow-up reply", async () => {
    let round = 0;
    const complete: ChatCompleter = async () => {
      round += 1;
      return round === 1
        ? {
            toolCalls: [{ id: "c1", name: "get_courses", arguments: "{}" }],
            content: null,
          }
        : { toolCalls: [], content: "You have one course." };
    };

    const result = await runAssistantTurn({
      messages: [{ role: "user", content: "what am I taking?" }],
      complete,
      executeTool: async () => [{ id: "x", name: "Network Security" }],
    });

    expect(result.reply).toBe("You have one course.");
    expect(result.toolCallsMade).toEqual(["get_courses"]);
  });

  test("stops after the round limit rather than looping forever", async () => {
    let calls = 0;
    const complete: ChatCompleter = async (...args) => {
      calls += 1;
      return alwaysCallsTool(...args);
    };

    const result = await runAssistantTurn({
      messages: [{ role: "user", content: "loop please" }],
      complete,
      executeTool: async () => ({}),
    });

    expect(calls).toBeLessThanOrEqual(MAX_TOOL_ROUNDS + 1);
    expect(result.reply.length).toBeGreaterThan(0);
  });

  test("passes a rejected tool call back to the model instead of throwing", async () => {
    let round = 0;
    const complete: ChatCompleter = async () => {
      round += 1;
      return round === 1
        ? {
            toolCalls: [
              { id: "c1", name: "drop_database", arguments: "{}" },
            ],
            content: null,
          }
        : { toolCalls: [], content: "I can't do that, but I can list tasks." };
    };

    const result = await runAssistantTurn({
      messages: [{ role: "user", content: "drop the database" }],
      complete,
      executeTool: async () => {
        throw new Error("must never run for an invalid tool");
      },
    });

    expect(result.reply).toContain("can't do that");
  });

  test("reports a tool that throws without crashing the turn", async () => {
    let round = 0;
    const complete: ChatCompleter = async () => {
      round += 1;
      return round === 1
        ? {
            toolCalls: [{ id: "c1", name: "get_courses", arguments: "{}" }],
            content: null,
          }
        : { toolCalls: [], content: "Something went wrong reading courses." };
    };

    const result = await runAssistantTurn({
      messages: [{ role: "user", content: "list courses" }],
      complete,
      executeTool: async () => {
        throw new Error("database unreachable");
      },
    });

    expect(result.reply).toContain("Something went wrong");
  });

  test("rejects a tool call whose arguments are not valid JSON", async () => {
    let round = 0;
    let executed = false;
    const complete: ChatCompleter = async () => {
      round += 1;
      return round === 1
        ? {
            toolCalls: [
              { id: "c1", name: "create_task", arguments: "{not json" },
            ],
            content: null,
          }
        : { toolCalls: [], content: "Could you rephrase that?" };
    };

    await runAssistantTurn({
      messages: [{ role: "user", content: "add a task" }],
      complete,
      executeTool: async () => {
        executed = true;
        return {};
      },
    });

    expect(executed).toBe(false);
  });
});

describe("runAssistantTurn — the last call has to answer", () => {
  test("offers tools on every call but the last, and none on the last", async () => {
    const offered: boolean[] = [];
    const complete: ChatCompleter = async (messages, options) => {
      offered.push(options.allowTools);
      return alwaysCallsTool(messages, options);
    };

    await runAssistantTurn({
      messages: [{ role: "user", content: "loop please" }],
      complete,
      executeTool: async () => ({}),
    });

    expect(offered).toHaveLength(MAX_TOOL_ROUNDS + 1);
    expect(offered.slice(0, -1).every(Boolean)).toBe(true);
    expect(offered[offered.length - 1]).toBe(false);
  });

  test("offers tools on a turn that answers straight away", async () => {
    const offered: boolean[] = [];

    await runAssistantTurn({
      messages: [{ role: "user", content: "hello" }],
      complete: async (_messages, options) => {
        offered.push(options.allowTools);
        return { toolCalls: [], content: "Hi." };
      },
      executeTool: async () => ({}),
    });

    expect(offered).toEqual([true]);
  });
});

/** Asks for the given calls first, then fails on the next model call. */
function callsThenFails(
  toolCalls: { name: string; arguments: string }[]
): ChatCompleter {
  let round = 0;
  return async () => {
    round += 1;
    if (round === 1) {
      return {
        toolCalls: toolCalls.map((call, index) => ({
          id: `c${index}`,
          ...call,
        })),
        content: null,
      };
    }
    throw new Error("model unavailable");
  };
}

describe("runAssistantTurn — a turn that breaks part-way", () => {
  test("still throws when nothing had been changed, so the request fails as before", async () => {
    await expect(
      runAssistantTurn({
        messages: [{ role: "user", content: "what's due?" }],
        complete: callsThenFails([{ name: "get_tasks", arguments: "{}" }]),
        executeTool: async () => ({ tasks: [] }),
      })
    ).rejects.toThrow("model unavailable");
  });

  test("still throws when the model fails on its very first call", async () => {
    await expect(
      runAssistantTurn({
        messages: [{ role: "user", content: "hello" }],
        complete: async () => {
          throw new Error("model unavailable");
        },
        executeTool: async () => ({}),
      })
    ).rejects.toThrow("model unavailable");
  });

  test("answers with what was already changed, instead of inviting a retry that repeats it", async () => {
    const result = await runAssistantTurn({
      messages: [{ role: "user", content: "I have an essay due Friday" }],
      complete: callsThenFails([
        {
          name: "create_task",
          arguments: JSON.stringify({ title: "Essay", dueDate: "2026-09-18" }),
        },
        { name: "get_tasks", arguments: "{}" },
        { name: "delete_note", arguments: JSON.stringify({ noteId: "n1" }) },
      ]),
      executeTool: async (call) =>
        call.name === "create_task"
          ? { created: true, id: "t1", title: "Essay" }
          : call.name === "delete_note"
            ? { deleted: true }
            : { tasks: [] },
    });

    expect(result.changes).toEqual([
      'created the task "Essay"',
      "deleted a note",
    ]);
    expect(result.reply).toContain('created the task "Essay"');
    expect(result.reply).toContain("deleted a note");
    expect(result.reply).toMatch(/before asking again/);
    expect(result.failure).toBeInstanceOf(Error);
  });

  test("does not count a write the tool refused as a change", async () => {
    await expect(
      runAssistantTurn({
        messages: [{ role: "user", content: "add it under my course" }],
        complete: callsThenFails([
          {
            name: "create_task",
            arguments: JSON.stringify({ title: "Essay", courseId: "nope" }),
          },
        ]),
        executeTool: async () => ({
          created: false,
          error: "That course does not exist.",
        }),
      })
    ).rejects.toThrow("model unavailable");
  });

  test("does not count a write that threw as a change", async () => {
    await expect(
      runAssistantTurn({
        messages: [{ role: "user", content: "add an essay" }],
        complete: callsThenFails([
          { name: "create_task", arguments: JSON.stringify({ title: "Essay" }) },
        ]),
        executeTool: async () => {
          throw new Error("database unreachable");
        },
      })
    ).rejects.toThrow("model unavailable");
  });

  test("reports no changes on a turn that only read", async () => {
    let round = 0;
    const result = await runAssistantTurn({
      messages: [{ role: "user", content: "what am I taking?" }],
      complete: async () => {
        round += 1;
        return round === 1
          ? {
              toolCalls: [{ id: "c1", name: "get_courses", arguments: "{}" }],
              content: null,
            }
          : { toolCalls: [], content: "One course." };
      },
      executeTool: async () => [],
    });

    expect(result.changes).toEqual([]);
    expect(result.failure).toBeUndefined();
  });
});

describe("describeChange", () => {
  test("names what a successful write did, from its arguments", () => {
    const call = validateToolCall("create_semester", {
      name: "Autumn 2026",
      startDate: "2026-09-01",
      endDate: "2026-12-18",
    });
    if (!call.ok) throw new Error(call.error);

    expect(describeChange(call, { created: true, id: "s1" })).toBe(
      'added the term "Autumn 2026"'
    );
  });

  test("says nothing about a read", () => {
    const call = validateToolCall("search_notes", { query: "insulin" });
    if (!call.ok) throw new Error(call.error);

    expect(describeChange(call, { notes: [] })).toBeNull();
  });
});
