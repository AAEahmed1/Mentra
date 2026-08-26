import { validateToolCall, type ValidatedToolCall } from "@/lib/ai/tools";

/** Ceiling on tool round-trips in one turn, so a looping model can't run up cost. */
export const MAX_TOOL_ROUNDS = 5;

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: RequestedToolCall[];
};

export type RequestedToolCall = {
  id: string;
  name: string;
  arguments: string;
};

export type Completion = {
  toolCalls: RequestedToolCall[];
  content: string | null;
};

/** Injected so the loop is testable without calling OpenAI. */
export type ChatCompleter = (messages: ChatMessage[]) => Promise<Completion>;

export type AssistantTurn = {
  reply: string;
  toolCallsMade: string[];
};

const FALLBACK_REPLY =
  "I got stuck working that out. Could you ask me again, more specifically?";

/**
 * Runs one assistant turn: let the model think, run any tools it asks for,
 * feed the results back, repeat until it answers or hits the round limit.
 *
 * Every tool call is validated before it runs. A rejected or failing call is
 * reported back to the model as a tool result rather than thrown, so the
 * assistant can recover and say something useful instead of the turn dying.
 */
export async function runAssistantTurn({
  messages,
  complete,
  executeTool,
}: {
  messages: ChatMessage[];
  complete: ChatCompleter;
  executeTool: (call: ValidatedToolCall) => Promise<unknown>;
}): Promise<AssistantTurn> {
  const thread = [...messages];
  const toolCallsMade: string[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const outOfRounds = round === MAX_TOOL_ROUNDS;
    const completion = await complete(thread);

    if (completion.toolCalls.length === 0 || outOfRounds) {
      return {
        reply: completion.content?.trim() || FALLBACK_REPLY,
        toolCallsMade,
      };
    }

    thread.push({
      role: "assistant",
      content: completion.content ?? "",
      toolCalls: completion.toolCalls,
    });

    for (const requested of completion.toolCalls) {
      thread.push({
        role: "tool",
        toolCallId: requested.id,
        content: JSON.stringify(await resolveToolCall(requested, executeTool)),
      });
      toolCallsMade.push(requested.name);
    }
  }

  return { reply: FALLBACK_REPLY, toolCallsMade };
}

async function resolveToolCall(
  requested: RequestedToolCall,
  executeTool: (call: ValidatedToolCall) => Promise<unknown>
): Promise<unknown> {
  let parsedArgs: unknown;
  try {
    parsedArgs = requested.arguments ? JSON.parse(requested.arguments) : {};
  } catch {
    return { error: "Arguments were not valid JSON." };
  }

  const validated = validateToolCall(requested.name, parsedArgs);
  if (!validated.ok) {
    return { error: validated.error };
  }

  try {
    return await executeTool(validated);
  } catch {
    // The message never reaches the student verbatim; the model reads it and
    // explains in its own words. Don't leak internals into the transcript.
    return { error: "That lookup failed. Tell the student and move on." };
  }
}
