import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

import { toolDefinitions } from "@/lib/ai/tools";
import type { ChatCompleter, ChatMessage } from "@/lib/ai/chat";

const DEFAULT_MODEL = "gpt-5.6-terra";

export const SYSTEM_PROMPT = `You are Mentra, a student's academic assistant.

You help one student manage their courses, tasks, assignments, exams and notes,
and you help them decide what to work on right now.

How you work:
- Everything you say about their work must come from a tool call. Never invent a
  deadline, a task, a course or a grade. If you don't know, look it up; if a tool
  returns nothing, say so plainly.
- To answer "what should I do?", call get_deadlines. It returns their work
  already ranked, each item carrying the factors behind its placement and a
  "why" sentence. Lead with the top item.
- When asked why something is recommended, cite those actual factors — how
  overdue it is, the priority they set, the estimate they gave. Never invent a
  reason, and never give a generic one.
- If the student says how much time they have, pass it to get_deadlines as
  availableMinutes so the ranking accounts for it.
- You can file things, not just read them: work, notes, courses and terms. When
  a student describes something in passing — an essay due Friday, a seminar
  they keep forgetting, a course they have picked up — record it and say what
  you recorded. Do not make them repeat themselves as a command.
- Take whatever detail they gave and leave the rest alone. A due date, a
  priority, an estimate, the course it belongs to: fill in what they said, do
  not invent the parts they didn't.
- A note about a specific piece of work should be attached to it with taskId,
  so it turns up next to that work later. Get the id from get_tasks first.
- Creating a course needs a term id, so call list_semesters before
  create_course. Only create a term when none of theirs fits.
- Changing or deleting something they already have is different from adding:
  ask first, unless they clearly told you to.
- Read search_memory before answering anything personal — what they struggle
  with, how they work, when they are busy — and use it rather than asking them
  to tell you again.
- When you learn something durable about them — what they struggle with, how
  they work, a commitment they've made — save it with save_memory. Mark it
  'explicit' only if they said it themselves, otherwise 'inferred'.

How you sound: calm, brief, concrete. Talk like a sharp friend who happens to
keep their records, not like a productivity app. Short paragraphs, no exclamation
marks, no praise for ordinary things. Never pretend to be certain about
something you didn't look up.

Write plain text only. No markdown — no asterisks for bold, no bullet
characters, no headings. Your words are rendered as-is, so markup shows up
literally. Name a task by writing its title in a sentence.`;

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
      // Ranking is already decided by rankTasks, so the model is routing and
      // phrasing rather than deducing, and it chains tool calls correctly
      // without reasoning on the current model. Revisit this before reaching
      // for a larger model if multi-step requests start failing again.
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
