import { describe, expect, test } from "vitest";

import { parseAvailableMinutes } from "@/lib/available-minutes";

describe("parseAvailableMinutes", () => {
  test("reads the minutes a student picked", () => {
    expect(parseAvailableMinutes("45")).toBe(45);
  });

  test("means no limit when nothing was picked", () => {
    expect(parseAvailableMinutes(undefined)).toBeUndefined();
  });

  test("ignores a value that isn't a number", () => {
    expect(parseAvailableMinutes("soon")).toBeUndefined();
  });

  test("ignores repeated parameters rather than guessing which was meant", () => {
    expect(parseAvailableMinutes(["30", "60"])).toBeUndefined();
  });

  test("ignores no time at all, which would rank nothing", () => {
    expect(parseAvailableMinutes("0")).toBeUndefined();
  });

  test("ignores negative time", () => {
    expect(parseAvailableMinutes("-30")).toBeUndefined();
  });

  test("ignores a fractional value rather than rounding silently", () => {
    expect(parseAvailableMinutes("45.5")).toBeUndefined();
  });

  test("ignores more minutes than there are in a day", () => {
    // A hand-edited URL shouldn't be able to make the ranking meaningless.
    expect(parseAvailableMinutes("2000")).toBeUndefined();
  });

  test("accepts a whole day, the largest answer that means anything", () => {
    expect(parseAvailableMinutes("1440")).toBe(1440);
  });
});
