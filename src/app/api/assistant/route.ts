import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getStudentTime } from "@/lib/student-time";
import {
  runAssistantTurn,
  type AssistantTurn,
  type ChatMessage,
} from "@/lib/ai/chat";
import { createOpenAiCompleter } from "@/lib/ai/openai";
import {
  buildSystemPrompt,
  MAX_INJECTED_MEMORIES,
} from "@/lib/ai/system-prompt";
import { executeToolCall } from "@/lib/ai/execute";
import { MAX_TURNS_PER_WINDOW, TURN_WINDOW_MS } from "@/lib/ai/limits";
import { listRecentMemoriesForUser } from "@/lib/services/memory";
import {
  appendMessages,
  countTurnsSince,
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

const UNAVAILABLE = "The assistant is unavailable right now.";

/**
 * Scoped by owner, so naming someone else's thread finds nothing, and the turn
 * goes into a new thread of the student's own instead.
 */
async function getOwnConversation(userId: string, conversationId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });
}

/** "about 12 minutes", rounded up, never under a minute. */
function waitFor(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  return minutes === 1 ? "about a minute" : `about ${minutes} minutes`;
}

export async function POST(request: Request) {
  // Not requireUserId: that redirects, and a fetch follows the redirect into a
  // sign-in page's HTML, which the panel can only read as a broken connection.
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Your session has ended. Sign in again to keep asking." },
      { status: 401 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "The assistant isn't configured yet — no API key is set." },
      { status: 503 }
    );
  }

  const unreadable = () =>
    NextResponse.json(
      { error: "That message couldn't be read." },
      { status: 400 }
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return unreadable();
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return unreadable();

  let turn: AssistantTurn | null = null;

  try {
    // Checked before anything is sent to OpenAI: this is the ceiling on what
    // one student can spend. Real instants here, not the student's clock — it
    // is compared with stored timestamps.
    const windowStart = new Date(Date.now() - TURN_WINDOW_MS);
    const recent = await countTurnsSince(userId, windowStart);
    if (recent.count >= MAX_TURNS_PER_WINDOW) {
      const freesAt =
        (recent.oldest ?? windowStart).getTime() + TURN_WINDOW_MS;
      const waitMs = freesAt - Date.now();
      return NextResponse.json(
        {
          error: `That's the limit of ${MAX_TURNS_PER_WINDOW} questions an hour. Try again in ${waitFor(waitMs)}.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil(waitMs / 1000))),
          },
        }
      );
    }

    // One clock for the whole turn, so the date the assistant reasons from and
    // the date the ranking counts against cannot land either side of midnight.
    // It is the student's clock, so "today" is their day, not the server's.
    const { now } = await getStudentTime();

    // A conversation is only created when one is needed, so opening the panel
    // and saying nothing doesn't litter the list with empty threads.
    const conversation =
      (parsed.data.conversationId
        ? await getOwnConversation(userId, parsed.data.conversationId)
        : await latestConversationForUser(userId)) ??
      (await createConversation(userId));

    const [{ memories, total: totalMemories }, history] = await Promise.all([
      listRecentMemoriesForUser(userId, MAX_INJECTED_MEMORIES),
      listMessagesForConversation(userId, conversation.id),
    ]);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: buildSystemPrompt({ now, memories, totalMemories }),
      },
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "user", content: parsed.data.message },
    ];

    turn = await runAssistantTurn({
      messages,
      complete: createOpenAiCompleter(),
      // userId is bound here, from the session — never from the model.
      executeTool: (call) => executeToolCall(userId, call, now),
    });

    // The turn broke after changing something. Its reply says what changed and
    // is stored like any other, but the failure still needs to be seen.
    if (turn.failure) {
      console.error("assistant turn failed after writing", turn.failure);
      Sentry.captureException(turn.failure, {
        tags: { area: "assistant", stage: "after_write" },
      });
    }

    // Written only once the turn produced a reply, so a failed request doesn't
    // leave a question in the transcript with no answer under it.
    await appendMessages(userId, conversation.id, [
      { role: "user", content: parsed.data.message },
      { role: "assistant", content: turn.reply },
    ]);

    return NextResponse.json({
      reply: turn.reply,
      conversationId: conversation.id,
    });
  } catch (error) {
    // Logged without the message or the reply: what a student asked stays out
    // of the error tracker.
    console.error("assistant turn failed", error);
    Sentry.captureException(error, { tags: { area: "assistant" } });

    // Only saving the transcript can fail after a write went through. The
    // client will drop the question, so say plainly that something changed.
    if (turn && turn.changes.length > 0) {
      return NextResponse.json(
        {
          error: `Some of that went through — I ${turn.changes.join(", ")} — but the reply couldn't be saved. Check before asking again.`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: UNAVAILABLE }, { status: 502 });
  }
}
