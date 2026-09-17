"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/session";
import { ROW_ACTION_OK, type RowActionResult } from "@/lib/action-state";
import { parseMemoryInput } from "@/lib/memory";
import { createMemory, deleteMemory } from "@/lib/services/memory";

export type MemoryActionState = {
  errors: string[];
};

export async function createMemoryAction(
  _prevState: MemoryActionState,
  formData: FormData
): Promise<MemoryActionState> {
  const userId = await requireUserId();

  const result = parseMemoryInput({
    content: formData.get("content"),
    type: formData.get("type"),
    source: formData.get("source"),
  });

  if (!result.success) {
    return { errors: result.errors };
  }

  await createMemory(userId, result.data);

  revalidatePath("/privacy");
  return { errors: [] };
}

export async function deleteMemoryAction(
  formData: FormData
): Promise<RowActionResult> {
  const userId = await requireUserId();
  const memoryId = String(formData.get("memoryId") ?? "");

  const deleted = await deleteMemory(userId, memoryId);
  if (!deleted.success) {
    return { error: "That memory was already forgotten." };
  }

  revalidatePath("/privacy");
  return ROW_ACTION_OK;
}
