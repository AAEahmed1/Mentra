import { describe, expect, test } from "vitest";
import { runAssistantTurn, MAX_TOOL_ROUNDS } from "@/lib/ai/chat";
import type { ChatCompleter } from "@/lib/ai/chat";

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
