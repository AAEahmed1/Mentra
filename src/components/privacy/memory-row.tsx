"use client";

import { deleteMemoryAction } from "@/lib/actions/memory";
import { useRowAction } from "@/lib/use-row-actions";
import type { Memory } from "@/generated/prisma/client";
import { FiledRow, RowMeta } from "@/components/filed-row";
import { ConfirmAction } from "@/components/confirm-action";

const TYPE_LABEL: Record<Memory["type"], string> = {
  profile: "Profile",
  commitment: "Commitment",
  learning_state: "Learning state",
  behavioral: "Behavioral",
};

export function MemoryRow({
  memory,
  timeZone,
}: {
  memory: Memory;
  /** The student's zone, so the recorded date is their own day. */
  timeZone: string;
}) {
  const forget = useRowAction(deleteMemoryAction);

  const recorded = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(memory.createdAt);

  return (
    <FiledRow
      align="start"
      error={forget.error}
      actions={
        <ConfirmAction
          label="Forget"
          itemName={memory.content}
          onConfirm={() => forget.run("memoryId", memory.id)}
          isPending={forget.isPending}
        />
      }
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm">{memory.content}</p>
        <div className="mt-0.5">
          <RowMeta>
            {TYPE_LABEL[memory.type]} ·{" "}
            {memory.source === "explicit" ? "You told me" : "I inferred"} ·{" "}
            {recorded}
          </RowMeta>
        </div>
      </div>
    </FiledRow>
  );
}
