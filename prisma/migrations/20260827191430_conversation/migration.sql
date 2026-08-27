-- Splits the single per-student message log into named conversations.
--
-- Existing messages are not thrown away: each student who has said anything
-- gets one conversation holding everything they have said so far, titled from
-- their opening line. The column is added nullable, backfilled, and only then
-- made NOT NULL, because doing it in one step would fail on any existing row.

-- CreateTable
CREATE TABLE "conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_userId_updatedAt_idx" ON "conversation"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "message" ADD COLUMN "conversationId" TEXT;

-- Backfill: one conversation per student who already has messages.
INSERT INTO "conversation" ("id", "userId", "title", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    m."userId",
    (
        SELECT left(m2."content", 80)
        FROM "message" m2
        WHERE m2."userId" = m."userId" AND m2."role" = 'user'
        ORDER BY m2."seq" ASC
        LIMIT 1
    ),
    MIN(m."createdAt"),
    MAX(m."createdAt")
FROM "message" m
GROUP BY m."userId";

UPDATE "message" m
SET "conversationId" = c."id"
FROM "conversation" c
WHERE c."userId" = m."userId";

ALTER TABLE "message" ALTER COLUMN "conversationId" SET NOT NULL;

-- DropIndex
DROP INDEX "message_userId_seq_idx";

-- CreateIndex
CREATE INDEX "message_conversationId_seq_idx" ON "message"("conversationId", "seq");

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
