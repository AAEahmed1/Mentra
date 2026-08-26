import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { listMemoriesForUser } from "@/lib/services/memory";
import { CreateMemoryForm } from "@/components/privacy/create-memory-form";
import { MemoryRow } from "@/components/privacy/memory-row";
import { DeleteAccountForm } from "@/components/privacy/delete-account-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy — Mentra",
};

export default async function PrivacyPage() {
  const userId = await requireUserId();
  const memories = await listMemoriesForUser(userId);

  return (
    <div className="min-h-svh bg-background">
      <AppHeader current="/privacy" />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-balance">
            What Mentra knows about you
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything Mentra has learned, in plain language. Forget anything
            that&apos;s wrong or that you&apos;d rather it didn&apos;t keep.
          </p>
        </div>

        {memories.length > 0 ? (
          <Card>
            <CardContent>
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {memories.map((memory) => (
                  <MemoryRow key={memory.id} memory={memory} />
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            Mentra hasn&apos;t learned anything about you yet. Once the
            assistant arrives it will record what it picks up here, and you can
            correct or forget any of it.
          </p>
        )}

        <div className="rounded-lg border border-dashed border-border p-5">
          <h2 className="mb-1 text-sm font-medium text-muted-foreground">
            Add a memory
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            The assistant will write these itself later. For now you can add
            them by hand to see how they read.
          </p>
          <CreateMemoryForm />
        </div>

        <section
          aria-labelledby="danger-heading"
          className="rounded-lg border border-destructive/30 p-5"
        >
          <h2
            id="danger-heading"
            className="mb-3 text-sm font-medium text-destructive"
          >
            Delete account
          </h2>
          <DeleteAccountForm />
        </section>
      </main>
    </div>
  );
}
