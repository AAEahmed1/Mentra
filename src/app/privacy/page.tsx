import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { getStudentTime } from "@/lib/student-time";
import { AppShell } from "@/components/app-shell";
import { RunningHead } from "@/components/running-head";
import { listMemoriesForUser } from "@/lib/services/memory";
import { CreateMemoryForm } from "@/components/privacy/create-memory-form";
import { MemoryRow } from "@/components/privacy/memory-row";
import { DeleteAccountForm } from "@/components/privacy/delete-account-form";

export const metadata: Metadata = {
  title: "Privacy — Mentra",
};

export default async function PrivacyPage() {
  const userId = await requireUserId();
  const { timeZone } = await getStudentTime();
  const memories = await listMemoriesForUser(userId);

  return (
    <AppShell
      title="What Mentra knows"
      lede="Everything it has learned about you, in plain language. Forget anything that's wrong."
    >
      {memories.length > 0 ? (
        <section className="flex flex-col gap-4">
          <RunningHead>Recorded</RunningHead>
          <ul className="flex flex-col">
            {memories.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} timeZone={timeZone} />
            ))}
          </ul>
        </section>
      ) : (
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          Nothing yet. As you work with the assistant it records what it picks
          up here, and you can correct or forget any of it.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <div>
          <RunningHead>Add a memory</RunningHead>
          <p className="mt-3 max-w-[60ch] text-sm text-muted-foreground">
            The assistant writes these itself. You can add one by hand to see
            how it reads.
          </p>
        </div>
        <CreateMemoryForm />
      </section>

      <section
        aria-labelledby="danger-heading"
        className="flex flex-col gap-4"
      >
        <RunningHead id="danger-heading" tone="danger">
          Delete account
        </RunningHead>
        <DeleteAccountForm />
      </section>
    </AppShell>
  );
}
