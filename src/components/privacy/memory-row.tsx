"use client";

import { deleteMemoryAction } from "@/lib/actions/memory";
import { useRowAction } from "@/lib/use-row-actions";
import type { Memory } from "@/generated/prisma/client";
import { FiledRow, RowMeta } from "@/components/filed-row";
import { Button } from "@/components/ui/button";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const TYPE_LABEL: Record<Memory["type"], string> = {
  profile: "Profile",
  commitment: "Commitment",
  learning_state: "Learning state",
  behavioral: "Behavioral",
};

export function MemoryRow({ memory }: { memory: Memory }) {
  const forget = useRowAction(deleteMemoryAction);

  return (
    <FiledRow
      align="start"
      actions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => forget.run("memoryId", memory.id)}
          disabled={forget.isPending}
        >
          Forget
        </Button>
      }
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm">{memory.content}</p>
        <div className="mt-0.5">
          <RowMeta>
            {TYPE_LABEL[memory.type]} ·{" "}
            {memory.source === "explicit" ? "You told me" : "I inferred"} ·{" "}
            {dateFormatter.format(memory.createdAt)}
          </RowMeta>
        </div>
      </div>
    </FiledRow>
  );
}
