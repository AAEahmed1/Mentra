-- AlterTable
ALTER TABLE "note" ADD COLUMN     "taskId" TEXT;

-- CreateIndex
CREATE INDEX "note_taskId_idx" ON "note"("taskId");

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
