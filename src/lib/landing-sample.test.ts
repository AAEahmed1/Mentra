import { describe, expect, it } from "vitest";

import { buildSampleTerm } from "@/lib/landing-sample";

// A fixed instant, so the relative dates the sample is built from are
// checked against a known today rather than against the clock.
const NOW = new Date("2026-09-12T15:30:00.000Z");

describe("buildSampleTerm", () => {
  it("ranks the slipped piece of work first, so the band prints in oxblood", () => {
    const { ranked } = buildSampleTerm(NOW);
    const [top] = ranked;

    expect(top.factors.urgency).toBe("overdue");
    expect(top.factors.daysUntilDue).toBeLessThan(0);
  });

  it("has exactly one entry due today, so the green plate appears once", () => {
    const { ranked } = buildSampleTerm(NOW);
    const today = ranked.filter((entry) => entry.factors.daysUntilDue === 0);

    expect(today).toHaveLength(1);
  });

  it("keeps every dated entry inside the term table's window", () => {
    const { ranked } = buildSampleTerm(NOW);

    for (const entry of ranked) {
      const days = entry.factors.daysUntilDue;
      if (days === null) continue;
      expect(days).toBeGreaterThanOrEqual(-7);
      expect(days).toBeLessThanOrEqual(21);
    }
  });

  it("leaves out nothing: every sample task is open", () => {
    const { ranked, tasks } = buildSampleTerm(NOW);

    expect(ranked).toHaveLength(tasks.length);
  });

  it("names a course for every course id a task carries", () => {
    const { ranked, courseNameById } = buildSampleTerm(NOW);

    for (const entry of ranked) {
      if (entry.task.courseId === null) continue;
      expect(courseNameById.get(entry.task.courseId)).toBeTruthy();
    }
  });

  it("includes at least one piece of work with no course, so the unfiled lane shows", () => {
    const { ranked } = buildSampleTerm(NOW);

    expect(ranked.some((entry) => entry.task.courseId === null)).toBe(true);
  });

  it("dates work to whole UTC days, the basis the rest of Mentra counts on", () => {
    const { tasks } = buildSampleTerm(NOW);

    for (const task of tasks) {
      if (!task.dueDate) continue;
      expect(task.dueDate.getUTCHours()).toBe(0);
      expect(task.dueDate.getUTCMinutes()).toBe(0);
    }
  });
});
