import { describe, expect, test } from "vitest";
import { parseOnboardingInput } from "@/lib/onboarding";

describe("parseOnboardingInput", () => {
  test("accepts program and institution", () => {
    const result = parseOnboardingInput({
      program: "Cybersecurity",
      institution: "State University",
    });

    expect(result).toEqual({
      success: true,
      data: {
        program: "Cybersecurity",
        institution: "State University",
      },
    });
  });

  test("treats both fields as optional when left blank", () => {
    const result = parseOnboardingInput({
      program: null,
      institution: null,
    });

    expect(result).toEqual({
      success: true,
      data: { program: undefined, institution: undefined },
    });
  });

  test("treats whitespace-only input as skipped (undefined)", () => {
    const result = parseOnboardingInput({
      program: "   ",
      institution: "",
    });

    expect(result).toEqual({
      success: true,
      data: { program: undefined, institution: undefined },
    });
  });

  test("trims surrounding whitespace", () => {
    const result = parseOnboardingInput({
      program: "  Cybersecurity  ",
      institution: null,
    });

    expect(result.success && result.data.program).toBe("Cybersecurity");
  });
});
