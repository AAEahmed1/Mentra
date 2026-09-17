import { Prisma } from "@/generated/prisma/client";

/**
 * A write referenced a row that disappeared after it was checked — a course
 * deleted between confirming it was the student's and filing work under it.
 * Services report it as the same "not found" the check itself would have.
 */
export function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
