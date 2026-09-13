import { describe, expect, it } from "vitest";

import { countdown, dueLabel } from "@/lib/due-label";

describe("dueLabel", () => {
  it("names undated work plainly", () => {
    expect(dueLabel(null)).toBe("No deadline");
  });

  it("counts slipped work in whole days over", () => {
    expect(dueLabel(-1)).toBe("1 day over");
    expect(dueLabel(-4)).toBe("4 days over");
  });

  it("uses words for today and tomorrow", () => {
    expect(dueLabel(0)).toBe("Today");
    expect(dueLabel(1)).toBe("Tomorrow");
  });

  it("counts anything further out in days", () => {
    expect(dueLabel(2)).toBe("2 days");
    expect(dueLabel(13)).toBe("13 days");
  });
});

describe("countdown", () => {
  it("has no figure for undated work", () => {
    expect(countdown(null)).toEqual({ figure: "—", word: "no date" });
  });

  it("reads slipped work as days over, singular and plural", () => {
    expect(countdown(-1)).toEqual({ figure: "1", word: "day over" });
    expect(countdown(-2)).toEqual({ figure: "2", word: "days over" });
  });

  it("reads today as zero due today", () => {
    expect(countdown(0)).toEqual({ figure: "0", word: "due today" });
  });

  it("reads upcoming work as days left, singular and plural", () => {
    expect(countdown(1)).toEqual({ figure: "1", word: "day left" });
    expect(countdown(6)).toEqual({ figure: "6", word: "days left" });
  });
});
