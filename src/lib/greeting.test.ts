import { describe, expect, test } from "vitest";
import { greetingForHour } from "@/lib/greeting";

describe("greetingForHour", () => {
  test("says good morning at 9am", () => {
    expect(greetingForHour(9)).toBe("Good morning");
  });

  test("says good afternoon at 2pm", () => {
    expect(greetingForHour(14)).toBe("Good afternoon");
  });

  test("says good evening at 7pm", () => {
    expect(greetingForHour(19)).toBe("Good evening");
  });

  test("says good night at 2am", () => {
    expect(greetingForHour(2)).toBe("Good night");
  });
});
