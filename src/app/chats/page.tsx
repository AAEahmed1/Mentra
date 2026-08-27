import type { Metadata } from "next";
import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { listConversationsForUser } from "@/lib/services/conversation";
import { startConversationAction } from "@/lib/actions/conversation";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Chats — Mentra",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function when(date: Date, now: Date): string {
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  return dateFormatter.format(date);
}

export default async function ChatsPage() {
  const userId = await requireUserId();
  const conversations = await listConversationsForUser(userId);
  const now = new Date();

  return (
    <AppShell
      title="Chats"
      lede="Everything you've asked Mentra, kept as separate conversations."
      actions={
        <form action={startConversationAction}>
          <Button type="submit">New chat</Button>
        </form>
      }
    >
      {conversations.length > 0 ? (
        <ul className="flex flex-col">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="border-b border-rule">
              <Link
                href={`/chats/${conversation.id}`}
                className="flex items-baseline justify-between gap-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {conversation.title ?? "Untitled chat"}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {conversation.messageCount}{" "}
                    {conversation.messageCount === 1 ? "message" : "messages"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {when(conversation.updatedAt, now)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing yet. Ask Mentra something from any page and it will turn up
          here.
        </p>
      )}
    </AppShell>
  );
}
