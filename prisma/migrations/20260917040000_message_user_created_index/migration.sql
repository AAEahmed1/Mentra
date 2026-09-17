-- Supports the assistant's per-student turn limit (recent user messages by
-- userId and createdAt) and the cascade when a student is deleted.
CREATE INDEX "message_userId_createdAt_idx" ON "message"("userId", "createdAt");
