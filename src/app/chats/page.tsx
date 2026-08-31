import type { Metadata } from "next";
import Link from "next/link";

import { requireUserId } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { listConversationsForUser } from "@/lib/services/conversation";
import { startConversationAction } from "@/lib/actions/conversation";
import { Button } from "@/components/ui/button";
import { RunningHead } from "@/components/running-head";

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
        <section className="flex flex-col gap-4">
          <RunningHead>Filed conversations</RunningHead>
          {/* Fixed columns, same as every other table in the edition: the
              title carries the link, the figures stay comparable down their
              own column. */}
          <table className="almanac-table">
            <thead>
              <tr>
                <th scope="col">
                  Conversation
                </th>
                <th scope="col" className="w-28 text-right">
                  Messages
                </th>
                <th scope="col" className="w-24 text-right">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.id} className="hover:bg-muted">
                  <td className="pr-4 text-sm">
                    <Link
                      href={`/chats/${conversation.id}`}
                      className="block truncate font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {conversation.title ?? "Untitled chat"}
                    </Link>
                  </td>
                  <td
                    data-figures
                    className="text-right text-xs text-muted-foreground"
                  >
                    {conversation.messageCount}
                  </td>
                  <td
                    data-figures
                    className="text-right text-xs text-muted-foreground"
                  >
                    {when(conversation.updatedAt, now)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing yet. Ask Mentra something from any page and it will turn up
          here.
        </p>
      )}
    </AppShell>
  );
}
