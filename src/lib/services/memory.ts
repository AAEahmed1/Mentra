import { prisma } from "@/lib/prisma";
import type { Memory } from "@/generated/prisma/client";
import type { MemoryInput } from "@/lib/memory";

export function createMemory(
  userId: string,
  data: MemoryInput
): Promise<Memory> {
  return prisma.memory.create({
    data: { ...data, userId },
  });
}

export function listMemoriesForUser(userId: string): Promise<Memory[]> {
  return prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * The newest `limit` memories and how many there are in all, in one round trip.
 *
 * For the assistant, which can only show a bounded number and has to say when
 * it cut the list short — loading every memory to count them would grow with
 * the student's whole history on every turn.
 */
export async function listRecentMemoriesForUser(
  userId: string,
  limit: number
): Promise<{ memories: Memory[]; total: number }> {
  const [memories, total] = await prisma.$transaction([
    prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.memory.count({ where: { userId } }),
  ]);

  return { memories, total };
}

export type DeleteMemoryResult =
  | { success: true }
  | { success: false; error: "not_found" };

export async function deleteMemory(
  userId: string,
  memoryId: string
): Promise<DeleteMemoryResult> {
  const { count } = await prisma.memory.deleteMany({
    where: { id: memoryId, userId },
  });

  if (count === 0) {
    return { success: false, error: "not_found" };
  }

  return { success: true };
}
