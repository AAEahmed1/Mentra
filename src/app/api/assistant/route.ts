import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUserId } from "@/lib/session";
import { runAssistantTurn, type ChatMessage } from "@/lib/ai/chat";
import { createOpenAiCompleter, SYSTEM_PROMPT } from "@/lib/ai/openai";
import { executeToolCall } from "@/lib/ai/execute";

/** Bounded so a client can't push an unlimited transcript back at us. */
const MAX_HISTORY = 20;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(MAX_HISTORY),
});

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

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...parsed.data.messages,
  ];

  try {
    const turn = await runAssistantTurn({
      messages,
      complete: createOpenAiCompleter(),
      // userId is bound here, from the session — never from the model.
      executeTool: (call) => executeToolCall(userId, call),
    });

    return NextResponse.json({ reply: turn.reply });
  } catch (error) {
    console.error("assistant turn failed", error);
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 }
    );
  }
}
