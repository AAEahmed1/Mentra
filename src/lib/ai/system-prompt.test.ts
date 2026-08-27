import { describe, expect, test } from "vitest";

import {
  buildSystemPrompt,
  MAX_INJECTED_MEMORIES,
  type MemoryForPrompt,
} from "@/lib/ai/system-prompt";

const NOW = new Date("2026-08-27T09:00:00.000Z");

function memories(count: number): MemoryForPrompt[] {
  return Array.from({ length: count }, (_, index) => ({
    content: `Fact number ${index}`,
    type: "profile" as const,
    source: "inferred" as const,
  }));
}

describe("buildSystemPrompt — telling the model what day it is", () => {
  test("states today's date, so relative dates don't depend on the model's guess", () => {
    const prompt = buildSystemPrompt({ now: NOW, memories: [] });

    expect(prompt).toContain("2026-08-27");
  });

  test("names the weekday, so 'this Friday' can be worked out rather than assumed", () => {
    const prompt = buildSystemPrompt({ now: NOW, memories: [] });

    expect(prompt).toContain("Thursday");
  });

  test("reads the date in UTC, the same basis the rest of Mentra uses", () => {
    // Late UTC evening is already the next day in some local zones. The task
    // ranking counts calendar days in UTC, so the prompt has to agree with it.
    const lateEvening = new Date("2026-08-27T23:45:00.000Z");

    expect(buildSystemPrompt({ now: lateEvening, memories: [] })).toContain(
      "2026-08-27"
    );
  });
});

describe("buildSystemPrompt — putting memory in front of the model", () => {
  test("includes what Mentra knows, so recall doesn't depend on it choosing to look", () => {
    const prompt = buildSystemPrompt({
      now: NOW,
      memories: [
        {
          content: "Struggles with pharmacology calculations",
          type: "learning_state",
          source: "explicit",
        },
      ],
    });

    expect(prompt).toContain("Struggles with pharmacology calculations");
  });

  test("marks whether the student said it or Mentra inferred it", () => {
    const prompt = buildSystemPrompt({
      now: NOW,
      memories: [
        { content: "Works best early", type: "behavioral", source: "inferred" },
      ],
    });

    expect(prompt).toContain("behavioral");
    expect(prompt).toContain("inferred");
  });

  test("says plainly when nothing is known, so silence isn't read as forgetting", () => {
    const prompt = buildSystemPrompt({ now: NOW, memories: [] });

    expect(prompt).toMatch(/not recorded anything|nothing.*yet/i);
  });

  test("caps how much memory it injects, so a long history can't crowd out the turn", () => {
    const prompt = buildSystemPrompt({
      now: NOW,
      memories: memories(MAX_INJECTED_MEMORIES + 10),
    });

    expect(prompt).not.toContain(`Fact number ${MAX_INJECTED_MEMORIES}`);
    expect(prompt).toContain("Fact number 0");
  });

  test("tells the model to reach for search_memory when the list was cut short", () => {
    const prompt = buildSystemPrompt({
      now: NOW,
      memories: memories(MAX_INJECTED_MEMORIES + 1),
    });

    expect(prompt).toContain("search_memory");
  });
});

describe("buildSystemPrompt — the rules that were already there", () => {
  test("still carries the behavioural instructions", () => {
    const prompt = buildSystemPrompt({ now: NOW, memories: [] });

    expect(prompt).toContain("get_deadlines");
    expect(prompt).toContain("Mentra");
  });
});
