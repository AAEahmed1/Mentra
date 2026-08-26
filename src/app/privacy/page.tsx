import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { listMemoriesForUser } from "@/lib/services/memory";
import { CreateMemoryForm } from "@/components/privacy/create-memory-form";
import { MemoryRow } from "@/components/privacy/memory-row";
import { DeleteAccountForm } from "@/components/privacy/delete-account-form";

export const metadata: Metadata = {
  title: "Privacy — Mentra",
};

export default async function PrivacyPage() {
  const userId = await requireUserId();
  const memories = await listMemoriesForUser(userId);

  return (
    <AppShell
      title="What Mentra knows"
      lede="Everything it has learned about you, in plain language. Forget anything that's wrong."
    >
      {memories.length > 0 ? (
        <ul className="flex flex-col">
          {memories.map((memory) => (
            <MemoryRow key={memory.id} memory={memory} />
          ))}
        </ul>
      ) : (
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          Nothing yet. As you work with the assistant it records what it picks
          up here, and you can correct or forget any of it.
        </p>
      )}

      <section className="flex flex-col gap-4 border-t border-rule pt-6">
        <div>
          <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Add a memory
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
            The assistant writes these itself. You can add one by hand to see
            how it reads.
          </p>
        </div>
        <CreateMemoryForm />
      </section>

      <section
        aria-labelledby="danger-heading"
        className="flex flex-col gap-4 border-t border-rule pt-6"
      >
        <h2
          id="danger-heading"
          className="text-xs font-medium tracking-widest text-destructive uppercase"
        >
          Delete account
        </h2>
        <DeleteAccountForm />
      </section>
    </AppShell>
  );
}
