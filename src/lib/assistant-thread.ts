export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ThreadState = {
  conversationId: string | null;
  messages: ChatMessage[];
  isThinking: boolean;
  error: string | null;
};

/**
 * The one conversation currently open, held outside React.
 *
 * The floating panel and the chat page are two views of the same thread, and
 * they are mounted in different trees — the panel in the root layout, the page
 * in its children. Two copies of useState would drift the moment you typed into
 * one of them, so state lives here and both subscribe to it.
 */
const EMPTY: ThreadState = {
  conversationId: null,
  messages: [],
  isThinking: false,
  error: null,
};

let state: ThreadState = EMPTY;
const listeners = new Set<() => void>();

function set(next: Partial<ThreadState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): ThreadState {
  return state;
}

export function getServerSnapshot(): ThreadState {
  return EMPTY;
}

/**
 * Points the views at a conversation the server has already rendered.
 *
 * Called during render, so it has to be idempotent: seeding the thread that is
 * already open does nothing, and only a genuine change notifies.
 */
export function seedThread(
  conversationId: string | null,
  messages: ChatMessage[]
): void {
  if (state.conversationId === conversationId && state.messages.length > 0) {
    return;
  }
  if (state.conversationId === conversationId && messages.length === 0) {
    return;
  }

  state = { conversationId, messages, isThinking: false, error: null };
  listeners.forEach((listener) => listener());
}

/** Used by the layout, which knows the most recent thread but must not fight
 * a page that knows better which one is being read. */
export function seedThreadIfEmpty(
  conversationId: string | null,
  messages: ChatMessage[]
): void {
  if (state.conversationId !== null) return;
  seedThread(conversationId, messages);
}

export async function sendMessage(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || state.isThinking) return;

  const before = state.messages;
  const conversationId = state.conversationId;

  set({
    messages: [...before, { role: "user", content: trimmed }],
    isThinking: true,
    error: null,
  });

  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        ...(conversationId ? { conversationId } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // The turn was never stored, so drop the question rather than leaving it
      // sitting there unanswered after a reload.
      set({
        messages: before,
        error: data.error ?? "The assistant is unavailable right now.",
      });
      return;
    }

    set({
      conversationId: data.conversationId ?? conversationId,
      messages: [
        ...before,
        { role: "user", content: trimmed },
        { role: "assistant", content: data.reply },
      ],
    });
  } catch {
    set({
      messages: before,
      error: "Couldn't reach the assistant. Check your connection.",
    });
  } finally {
    set({ isThinking: false });
  }
}
