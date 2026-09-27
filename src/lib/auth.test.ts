import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, test } from "vitest";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const emails: string[] = [];

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  emails.length = 0;
});

/**
 * Signing up writes a user and a credential account through Better Auth's
 * Prisma adapter, so it breaks whenever Better Auth and schema.prisma stop
 * agreeing about a column. That happened once: an update stopped filling
 * `account.issuer`, and every new sign-up failed with a 500 while the type
 * checker and every other test passed.
 */
describe("email sign-up", () => {
  test("creates the student and a credential account", async () => {
    const email = `test-signup-${randomUUID()}@example.com`;
    emails.push(email);

    const result = await auth.api.signUpEmail({
      body: { name: "Test Student", email, password: "a-long-test-password" },
    });

    expect(result.user.email).toBe(email);
    const accounts = await prisma.account.findMany({
      where: { userId: result.user.id },
    });
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ providerId: "credential" });
  });
});
