"use client";

import { useTransition } from "react";

import { deleteMemoryAction } from "@/lib/actions/memory";
import type { Memory } from "@/generated/prisma/client";
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
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const formData = new FormData();
    formData.set("memoryId", memory.id);
    startTransition(() => deleteMemoryAction(formData));
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-2 bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm">{memory.content}</p>
        <p className="mt-0.5 font-mono text-xs tabular-nums-mono text-muted-foreground">
          {TYPE_LABEL[memory.type]} ·{" "}
          {memory.source === "explicit" ? "You told me" : "I inferred"} ·{" "}
          {dateFormatter.format(memory.createdAt)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
      >
        Forget
      </Button>
    </li>
  );
}
