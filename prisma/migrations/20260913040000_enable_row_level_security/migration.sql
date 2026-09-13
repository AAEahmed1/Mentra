-- Turns row level security on for every table in the public schema.
--
-- Supabase serves the public schema over PostgREST with the project's anon
-- key, and that key is meant to be public. Without RLS it can read and write
-- every row of every table: password hashes and OAuth tokens in "account",
-- session tokens in "session", every student's notes and conversations.
--
-- Mentra never uses that API. Every query goes through Prisma as the role
-- that owns the tables, and an owner is not subject to RLS, so enabling it
-- with no policies changes nothing for the app and closes the API outright:
-- the PostgREST roles see no rows and can write none.
--
-- Every new table needs the same line. src/lib/services/rls.test.ts fails
-- when any table in public is left open.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "semester" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
