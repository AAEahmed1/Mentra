import { describe, expect, test } from "vitest";
import { parsePasswordChangeInput, parseProfileInput } from "@/lib/profile";

describe("parseProfileInput", () => {
  test("accepts name, program and institution, trimmed", () => {
    const result = parseProfileInput({
      name: "  Ada Lovelace ",
      program: " Mathematics ",
      institution: "University of London",
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "Ada Lovelace",
        program: "Mathematics",
        institution: "University of London",
      },
    });
  });

  test("turns blank program and institution into null so they clear", () => {
    const result = parseProfileInput({
      name: "Ada",
      program: "   ",
      institution: null,
    });

    expect(result).toEqual({
      success: true,
      data: { name: "Ada", program: null, institution: null },
    });
  });

  test("requires a name", () => {
    expect(
      parseProfileInput({ name: "  ", program: null, institution: null }),
    ).toEqual({ success: false, errors: ["Name is required"] });
    expect(
      parseProfileInput({ name: null, program: null, institution: null }),
    ).toEqual({ success: false, errors: ["Name is required"] });
  });

  test("rejects overlong fields", () => {
    const result = parseProfileInput({
      name: "a".repeat(101),
      program: "b".repeat(121),
      institution: null,
    });

    expect(result).toEqual({
      success: false,
      errors: [
        "Name must be 100 characters or fewer",
        "Program must be 120 characters or fewer",
      ],
    });
  });
});

describe("parsePasswordChangeInput", () => {
  test("accepts a matching new password", () => {
    const result = parsePasswordChangeInput({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });

    expect(result).toEqual({
      success: true,
      data: { currentPassword: "old-password", newPassword: "new-password" },
    });
  });

  test("rejects a confirmation that doesn't match", () => {
    const result = parsePasswordChangeInput({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "new-passw0rd",
    });

    expect(result).toEqual({
      success: false,
      errors: ["New passwords don't match"],
    });
  });

  test("rejects a short new password", () => {
    const result = parsePasswordChangeInput({
      currentPassword: "old-password",
      newPassword: "short",
      confirmPassword: "short",
    });

    expect(result).toEqual({
      success: false,
      errors: ["New password must be at least 8 characters"],
    });
  });

  test("rejects reusing the current password", () => {
    const result = parsePasswordChangeInput({
      currentPassword: "same-password",
      newPassword: "same-password",
      confirmPassword: "same-password",
    });

    expect(result).toEqual({
      success: false,
      errors: ["New password must be different from the current one"],
    });
  });

  test("requires the current password", () => {
    const result = parsePasswordChangeInput({
      currentPassword: null,
      newPassword: "new-password",
      confirmPassword: "new-password",
    });

    expect(result.success).toBe(false);
  });
});
