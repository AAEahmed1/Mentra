import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";
import { getProfile, updateProfile } from "@/lib/services/profile";

let userId: string;

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: `test-profile-${randomUUID()}@example.com`,
      emailVerified: true,
      program: "Cybersecurity",
      institution: "State University",
    },
  });
  userId = user.id;
});

afterEach(async () => {
  await prisma.user.delete({ where: { id: userId } });
});

async function linkAccount(providerId: string) {
  await prisma.account.create({
    data: {
      id: randomUUID(),
      issuer: providerId,
      accountId: randomUUID(),
      providerId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

describe("getProfile", () => {
  test("returns the editable fields", async () => {
    const profile = await getProfile(userId);

    expect(profile).toMatchObject({
      name: "Test Student",
      program: "Cybersecurity",
      institution: "State University",
      hasPassword: false,
      socialProviders: [],
    });
  });

  test("reports a password account", async () => {
    await linkAccount("credential");

    const profile = await getProfile(userId);

    expect(profile?.hasPassword).toBe(true);
    expect(profile?.socialProviders).toEqual([]);
  });

  test("reports a Google account without a password", async () => {
    await linkAccount("google");

    const profile = await getProfile(userId);

    expect(profile?.hasPassword).toBe(false);
    expect(profile?.socialProviders).toEqual(["google"]);
  });

  test("returns null for an unknown user", async () => {
    expect(await getProfile(randomUUID())).toBeNull();
  });
});

describe("updateProfile", () => {
  test("updates name, program and institution", async () => {
    await updateProfile(userId, {
      name: "Renamed Student",
      program: "Software Engineering",
      institution: "City College",
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user).toMatchObject({
      name: "Renamed Student",
      program: "Software Engineering",
      institution: "City College",
    });
  });

  test("clears program and institution when given null", async () => {
    await updateProfile(userId, {
      name: "Test Student",
      program: null,
      institution: null,
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.program).toBeNull();
    expect(user.institution).toBeNull();
  });

  test("leaves the email alone", async () => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    await updateProfile(userId, {
      name: "Renamed Student",
      program: null,
      institution: null,
    });

    const after = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    expect(after.email).toBe(before.email);
  });
});
