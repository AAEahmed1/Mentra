import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

import { toolDefinitions } from "@/lib/ai/tools";
import type { ChatCompleter, ChatMessage } from "@/lib/ai/chat";

const DEFAULT_MODEL = "gpt-5.6-terra";

// The prompt itself lives in system-prompt.ts: it is rebuilt every turn from
// the date and what Mentra remembers, so it cannot be a constant here.

const tools: ChatCompletionTool[] = toolDefinitions.map((definition) => ({
  type: "function",
  function: {
    name: definition.name,
    description: definition.description,
    parameters: definition.parameters,
  },
}));

function toOpenAiMessages(
  messages: ChatMessage[]
): ChatCompletionMessageParam[] {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "tool",
        tool_call_id: message.toolCallId ?? "",
        content: message.content,
      };
    }

    if (message.role === "assistant" && message.toolCalls?.length) {
      return {
        role: "assistant",
        content: message.content || null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: "function" as const,
          function: { name: call.name, arguments: call.arguments },
        })),
      };
    }

    return {
      role: message.role,
      content: message.content,
    } as ChatCompletionMessageParam;
  });
}

/**
 * The real completer. Kept behind the ChatCompleter interface so the loop in
 * chat.ts stays testable without a network call or an API key.
 */
export function createOpenAiCompleter(): ChatCompleter {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  return async (messages) => {
    const completion = await client.chat.completions.create({
      model,
      messages: toOpenAiMessages(messages),
      tools,
      // Must stay "none": this endpoint rejects any other value when function
      // tools are attached ("Function tools with reasoning_effort are not
      // supported for gpt-5.6-terra in /v1/chat/completions"). Reasoning plus
      // tools needs /v1/responses, which is a different request and response
      // shape. Ranking is decided by rankTasks anyway, so the model routes and
      // phrases rather than deduces.
      reasoning_effort: "none",
    });

    const choice = completion.choices[0]?.message;

    return {
      content: choice?.content ?? null,
      toolCalls: (choice?.tool_calls ?? []).flatMap((call) =>
        call.type === "function"
          ? [
              {
                id: call.id,
                name: call.function.name,
                arguments: call.function.arguments,
              },
            ]
          : []
      ),
    };
  };
}
