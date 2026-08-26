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
