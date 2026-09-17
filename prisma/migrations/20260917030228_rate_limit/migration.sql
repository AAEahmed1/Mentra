-- Better Auth's rate-limit counters, moved out of per-instance memory so a
-- limit holds across every serverless instance. See RateLimit in schema.prisma.

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_lastRequest_idx" ON "rate_limit"("lastRequest");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");


-- Every public table is closed to Supabase's REST API; see
-- 20260913040000_enable_row_level_security. This one holds client IPs.
ALTER TABLE "rate_limit" ENABLE ROW LEVEL SECURITY;
