export type ChatMessage = {
  /** Stable across re-renders, so React keys don't shift as the thread grows. */
  id: string;
  role: "user" | "assistant";
  content: string;
};

/** A message as the server hands it over; stored rows carry their own id. */
export type SeedMessage = Omit<ChatMessage, "id"> & { id?: string };

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
 *
 * Browser only. On the server this module is shared by every request in the
 * process, so a write there would hand one student's conversation to whoever
 * rendered next. Every write is a no-op without `window`, and server renders
 * read `getServerSnapshot`, which is always empty.
 */
const EMPTY: ThreadState = {
  conversationId: null,
  messages: [],
  isThinking: false,
  error: null,
};

export const UNAVAILABLE_ERROR = "The assistant is unavailable right now.";
export const CONNECTION_ERROR =
  "Couldn't reach the assistant. Check your connection.";

let state: ThreadState = EMPTY;
const listeners = new Set<() => void>();

/**
 * Bumped whenever the store is pointed somewhere else. A request remembers the
 * generation it started in and drops its result if that has moved on, so a
 * slow reply can't land in a thread the student has since left.
 */
let generation = 0;
let localIds = 0;

const onServer = () => typeof window === "undefined";

function set(next: Partial<ThreadState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function replace(next: ThreadState) {
  generation += 1;
  state = next;
  listeners.forEach((listener) => listener());
}

function localMessage(
  role: ChatMessage["role"],
  content: string
): ChatMessage {
  localIds += 1;
  return { id: `local-${localIds}`, role, content };
}

function withIds(
  conversationId: string | null,
  messages: SeedMessage[]
): ChatMessage[] {
  return messages.map((message, index) => ({
    ...message,
    id: message.id ?? `${conversationId ?? "new"}-${index}`,
  }));
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
 * Called during render, so it has to be idempotent: re-seeding what is already
 * showing does nothing, and only a genuine change notifies.
 *
 * - A different conversation replaces the thread, and any reply still on its
 *   way for the old one is dropped when it arrives.
 * - The same conversation is replaced only when the server has more of it —
 *   lines are only ever appended, so more means newer, as when the chat went
 *   on in another tab — and nothing is in flight here. A shorter copy is an
 *   older render, or the panel's forty-line window, and is ignored.
 */
export function seedThread(
  conversationId: string | null,
  messages: SeedMessage[]
): void {
  if (onServer()) return;

  if (state.conversationId === conversationId) {
    if (state.isThinking || messages.length <= state.messages.length) return;
  }

  replace({
    conversationId,
    messages: withIds(conversationId, messages),
    isThinking: false,
    error: null,
  });
}

/** Used by the layout, which knows the most recent thread but must not fight
 * a page that knows better which one is being read — nor a first message
 * already on its way in a thread that has no id yet. */
export function seedThreadIfEmpty(
  conversationId: string | null,
  messages: SeedMessage[]
): void {
  if (onServer()) return;
  if (
    state.conversationId !== null ||
    state.messages.length > 0 ||
    state.isThinking
  ) {
    return;
  }
  seedThread(conversationId, messages);
}

/**
 * Lets go of a conversation that is being deleted, if it is the one open.
 * Otherwise the panel would go on showing it, and the next message would
 * quietly start a new thread under the old one's transcript.
 */
export function forgetThread(conversationId: string): void {
  if (onServer()) return;
  if (state.conversationId !== conversationId) return;
  replace(EMPTY);
}

export async function sendMessage(text: string): Promise<void> {
  if (onServer()) return;

  const trimmed = text.trim();
  if (!trimmed || state.isThinking) return;

  const startedIn = generation;
  const stillHere = () => generation === startedIn;

  const before = state.messages;
  const conversationId = state.conversationId;
  const question = localMessage("user", trimmed);

  set({
    messages: [...before, question],
    isThinking: true,
    error: null,
  });

  // The turn was never stored, so drop the question rather than leaving it
  // sitting there unanswered after a reload.
  const fail = (error: string) =>
    set({ messages: before, isThinking: false, error });

  let response: Response;
  try {
    response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        ...(conversationId ? { conversationId } : {}),
      }),
    });
  } catch {
    if (stillHere()) fail(CONNECTION_ERROR);
    return;
  }

  // Something answered, so this is no longer a connection problem. A body that
  // isn't JSON — a proxy's error page, a redirect to sign-in — is the server
  // failing, and says nothing the student can act on.
  const data: unknown = await response.json().catch(() => null);
  if (!stillHere()) return;

  const body =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {};

  if (!response.ok || typeof body.reply !== "string") {
    fail(typeof body.error === "string" ? body.error : UNAVAILABLE_ERROR);
    return;
  }

  set({
    conversationId:
      typeof body.conversationId === "string"
        ? body.conversationId
        : conversationId,
    messages: [...before, question, localMessage("assistant", body.reply)],
    isThinking: false,
  });
}
