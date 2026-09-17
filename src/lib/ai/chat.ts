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

export type CompletionOptions = {
  /**
   * False on the last call a turn is allowed. With no tools attached the model
   * has to answer in words, rather than asking for a tool that would never run.
   */
  allowTools: boolean;
};

/** Injected so the loop is testable without calling OpenAI. */
export type ChatCompleter = (
  messages: ChatMessage[],
  options: CompletionOptions
) => Promise<Completion>;

export type AssistantTurn = {
  reply: string;
  toolCallsMade: string[];
  /** What this turn changed, in words, from write tools that reported success. */
  changes: string[];
  /**
   * Set when a model call failed after something had already been changed. The
   * reply then says so instead of the turn throwing; the route still reports it.
   */
  failure?: unknown;
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
 *
 * A failing model call throws, unless a write already succeeded this turn:
 * then the turn ends with a reply naming what was changed (see
 * `interruptedReply`), because the writes are not rolled back.
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
  const changes: string[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const outOfRounds = round === MAX_TOOL_ROUNDS;

    let completion: Completion;
    try {
      completion = await complete(thread, { allowTools: !outOfRounds });
    } catch (error) {
      // Nothing written yet: failing the request is honest, and asking again
      // is harmless. Once something has been written, a failed request looks
      // like nothing happened, and the retry it invites does it all twice.
      if (changes.length === 0) throw error;
      return {
        reply: interruptedReply(changes),
        toolCallsMade,
        changes,
        failure: error,
      };
    }

    if (completion.toolCalls.length === 0 || outOfRounds) {
      return {
        reply: completion.content?.trim() || FALLBACK_REPLY,
        toolCallsMade,
        changes,
      };
    }

    thread.push({
      role: "assistant",
      content: completion.content ?? "",
      toolCalls: completion.toolCalls,
    });

    for (const requested of completion.toolCalls) {
      const { call, result } = await resolveToolCall(requested, executeTool);
      thread.push({
        role: "tool",
        toolCallId: requested.id,
        content: JSON.stringify(result),
      });
      toolCallsMade.push(requested.name);

      const change = call ? describeChange(call, result) : null;
      if (change) changes.push(change);
    }
  }

  return { reply: FALLBACK_REPLY, toolCallsMade, changes };
}

async function resolveToolCall(
  requested: RequestedToolCall,
  executeTool: (call: ValidatedToolCall) => Promise<unknown>
): Promise<{ call: ValidatedToolCall | null; result: unknown }> {
  let parsedArgs: unknown;
  try {
    parsedArgs = requested.arguments ? JSON.parse(requested.arguments) : {};
  } catch {
    return { call: null, result: { error: "Arguments were not valid JSON." } };
  }

  const validated = validateToolCall(requested.name, parsedArgs);
  if (!validated.ok) {
    return { call: null, result: { error: validated.error } };
  }

  try {
    return { call: validated, result: await executeTool(validated) };
  } catch {
    // The message never reaches the student verbatim; the model reads it and
    // explains in its own words. Don't leak internals into the transcript.
    return {
      call: null,
      result: { error: "That lookup failed. Tell the student and move on." },
    };
  }
}

/** True when a write tool's result says the write happened. */
function succeeded(result: unknown, flag: string): boolean {
  return (
    typeof result === "object" &&
    result !== null &&
    (result as Record<string, unknown>)[flag] === true
  );
}

/**
 * A write that happened, in words the student will recognise, or null for a
 * read or a write that was refused. Read from the arguments and the result
 * rather than from the model, which is the thing that just failed.
 */
export function describeChange(
  call: ValidatedToolCall,
  result: unknown
): string | null {
  switch (call.name) {
    case "create_task":
      return succeeded(result, "created")
        ? `created the task "${call.args.title}"`
        : null;
    case "update_task":
      return succeeded(result, "updated")
        ? call.args.title
          ? `changed a task, now called "${call.args.title}"`
          : "changed a task"
        : null;
    case "complete_task":
      return succeeded(result, "completed") ? "marked a task complete" : null;
    case "delete_task":
      return succeeded(result, "deleted") ? "deleted a task" : null;
    case "create_note":
      return succeeded(result, "created")
        ? `wrote the note "${call.args.title}"`
        : null;
    case "update_note":
      return succeeded(result, "updated") ? "changed a note" : null;
    case "delete_note":
      return succeeded(result, "deleted") ? "deleted a note" : null;
    case "create_course":
      return succeeded(result, "created")
        ? `added the course "${call.args.name}"`
        : null;
    case "create_semester":
      return succeeded(result, "created")
        ? `added the term "${call.args.name}"`
        : null;
    case "save_memory":
      return succeeded(result, "saved")
        ? `saved to memory "${call.args.content}"`
        : null;
    default:
      return null;
  }
}

/**
 * The reply for a turn that broke after changing something. Plain text, like
 * every reply, and stored like one, so the transcript itself says what was done
 * and a later turn doesn't assume nothing was.
 */
function interruptedReply(changes: string[]): string {
  const list =
    changes.length === 1
      ? changes[0]
      : `${changes.slice(0, -1).join(", ")} and ${changes[changes.length - 1]}`;

  return `Something went wrong part-way through, before I could finish. By then I had already ${list}. Check that before asking again, so nothing is done twice.`;
}
