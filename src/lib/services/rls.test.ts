import { describe, expect, test } from "vitest";

import { prisma } from "@/lib/prisma";

/**
 * Supabase exposes the public schema over its REST API with a key that is
 * meant to be public. Row level security is what keeps that key out of every
 * table, and Prisma does not turn it on for new tables, so this test is the
 * reminder: a model added without the matching ALTER TABLE fails here rather
 * than in the Security Advisor after it has shipped.
 */
describe("row level security", () => {
  test("is enabled on every table in the public schema", async () => {
    const open = await prisma.$queryRaw<{ relname: string }[]>`
      SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND NOT c.relrowsecurity
      ORDER BY c.relname
    `;

    expect(open.map((row) => row.relname)).toEqual([]);
  });
});
