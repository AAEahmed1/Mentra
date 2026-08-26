import { describe, expect, test } from "vitest";
import { explainRecommendation } from "@/lib/recommendation-reason";
import type { RankFactors } from "@/lib/recommendations";

function factors(overrides: Partial<RankFactors> = {}): RankFactors {
  return {
    urgency: "upcoming",
    daysUntilDue: 7,
    priority: "medium",
    estimatedDuration: null,
    fitsAvailableTime: null,
    ...overrides,
  };
}

describe("explainRecommendation", () => {
  test("leads with how overdue a task is", () => {
    const reason = explainRecommendation(
      factors({ urgency: "overdue", daysUntilDue: -3 })
    );

    expect(reason).toContain("3 days overdue");
  });

  test("uses the singular for one day overdue", () => {
    const reason = explainRecommendation(
      factors({ urgency: "overdue", daysUntilDue: -1 })
    );

    expect(reason).toContain("1 day overdue");
  });

  test("says due today rather than in zero days", () => {
    const reason = explainRecommendation(
      factors({ urgency: "due_soon", daysUntilDue: 0 })
    );

    expect(reason).toContain("due today");
  });

  test("says due tomorrow rather than in one day", () => {
    const reason = explainRecommendation(
      factors({ urgency: "due_soon", daysUntilDue: 1 })
    );

    expect(reason).toContain("due tomorrow");
  });

  test("counts the days for something further out", () => {
    const reason = explainRecommendation(
      factors({ urgency: "due_soon", daysUntilDue: 3 })
    );

    expect(reason).toContain("due in 3 days");
  });

  test("mentions high priority", () => {
    const reason = explainRecommendation(factors({ priority: "high" }));

    expect(reason).toContain("high priority");
  });

  test("does not mention priority when it is the default", () => {
    const reason = explainRecommendation(factors({ priority: "medium" }));

    expect(reason).not.toContain("priority");
  });

  test("mentions the estimate when there is one", () => {
    const reason = explainRecommendation(factors({ estimatedDuration: 55 }));

    expect(reason).toContain("55 min");
  });

  test("warns when the task will not fit the time available", () => {
    const reason = explainRecommendation(
      factors({ estimatedDuration: 180, fitsAvailableTime: false })
    );

    expect(reason).toContain("longer than the time you have");
  });

  test("explains a task with no deadline by what else it has", () => {
    const reason = explainRecommendation(
      factors({ urgency: "someday", daysUntilDue: null, priority: "high" })
    );

    expect(reason).toContain("no deadline");
    expect(reason).toContain("high priority");
  });

  test("reads as one sentence, capitalised and terminated", () => {
    const reason = explainRecommendation(
      factors({ urgency: "due_soon", daysUntilDue: 1, estimatedDuration: 30 })
    );

    expect(reason[0]).toBe(reason[0].toUpperCase());
    expect(reason.endsWith(".")).toBe(true);
  });
});
