import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUserId } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { getConversationForUser } from "@/lib/services/conversation";
import { AssistantThread } from "@/components/assistant/assistant-thread";
import { DeleteChatButton } from "@/components/assistant/delete-chat-button";
import { ThreadSeed } from "@/components/assistant/thread-seed";

export const metadata: Metadata = {
  title: "Chat — Mentra",
};

export default async function ChatPage({ params }: PageProps<"/chats/[id]">) {
  const userId = await requireUserId();
  const { id } = await params;

  const conversation = await getConversationForUser(userId, id);
  if (!conversation) notFound();

  return (
    <AppShell
      title={conversation.title ?? "Untitled chat"}
      lede="Read it back, and carry it on from here."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/chats"
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            All chats
          </Link>
          <DeleteChatButton conversationId={conversation.id} />
        </div>
      }
    >
      {/*
        Seeding rather than rendering the messages directly: the floating panel
        reads the same store, so opening it here continues this conversation
        instead of whichever one was last used.
      */}
      <ThreadSeed
        conversationId={conversation.id}
        messages={conversation.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        }))}
      />
      <div className="flex min-h-[60vh] flex-col">
        <AssistantThread variant="page" />
      </div>
    </AppShell>
  );
}
