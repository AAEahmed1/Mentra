import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { runAssistantTurn, type ChatMessage } from "@/lib/ai/chat";
import { createOpenAiCompleter } from "@/lib/ai/openai";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { executeToolCall } from "@/lib/ai/execute";
import { listMemoriesForUser } from "@/lib/services/memory";
import {
  appendMessages,
  listMessagesForConversation,
} from "@/lib/services/message";
import {
  createConversation,
  latestConversationForUser,
} from "@/lib/services/conversation";

// The client sends only what was just typed. History is read from the database,
// so a reload doesn't lose the conversation and the browser can't rewrite what
// was said earlier in it.
const requestSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
});

/** Scoped by owner, so naming someone else's thread falls back to their own. */
async function getOwnConversation(userId: string, conversationId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "The assistant isn't configured yet — no API key is set." },
      { status: 503 }
    );
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That message couldn't be read." },
      { status: 400 }
    );
  }

  // One clock for the whole turn, so the date the assistant reasons from and
  // the date the ranking counts against cannot land either side of midnight.
  const now = new Date();

  // A conversation is only created when one is needed, so opening the panel and
  // saying nothing doesn't litter the list with empty threads.
  const conversation =
    (parsed.data.conversationId
      ? await getOwnConversation(userId, parsed.data.conversationId)
      : await latestConversationForUser(userId)) ??
    (await createConversation(userId));

  const [memories, history] = await Promise.all([
    listMemoriesForUser(userId),
    listMessagesForConversation(userId, conversation.id),
  ]);

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt({ now, memories }) },
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: parsed.data.message },
  ];

  try {
    const turn = await runAssistantTurn({
      messages,
      complete: createOpenAiCompleter(),
      // userId is bound here, from the session — never from the model.
      executeTool: (call) => executeToolCall(userId, call, now),
    });

    // Written only once the turn succeeded, so a failed request doesn't leave a
    // question in the transcript with no answer under it.
    await appendMessages(userId, conversation.id, [
      { role: "user", content: parsed.data.message },
      { role: "assistant", content: turn.reply },
    ]);

    return NextResponse.json({
      reply: turn.reply,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("assistant turn failed", error);
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 }
    );
  }
}
