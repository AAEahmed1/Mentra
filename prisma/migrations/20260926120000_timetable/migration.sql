-- AlterEnum
ALTER TYPE "TaskType" ADD VALUE 'quiz';

-- CreateEnum
CREATE TYPE "MeetingKind" AS ENUM ('lecture', 'lab', 'tutorial', 'seminar', 'other');

-- CreateTable
CREATE TABLE "course_meeting" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "kind" "MeetingKind" NOT NULL DEFAULT 'lecture',
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_meeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_meeting_courseId_idx" ON "course_meeting"("courseId");

-- AddForeignKey
ALTER TABLE "course_meeting" ADD CONSTRAINT "course_meeting_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every public table is closed to Supabase's REST API; see
-- 20260913040000_enable_row_level_security.
ALTER TABLE "course_meeting" ENABLE ROW LEVEL SECURITY;
