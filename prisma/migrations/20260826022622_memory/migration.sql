-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('profile', 'commitment', 'learning_state', 'behavioral');

-- CreateEnum
CREATE TYPE "MemorySource" AS ENUM ('explicit', 'inferred');

-- CreateTable
CREATE TABLE "memory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "source" "MemorySource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_userId_idx" ON "memory"("userId");

-- AddForeignKey
ALTER TABLE "memory" ADD CONSTRAINT "memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
