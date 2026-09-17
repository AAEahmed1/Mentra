import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

type Store = typeof import("@/lib/assistant-thread");

/** A fresh copy of the store, since its state lives in the module. */
async function loadStore(): Promise<Store> {
  vi.resetModules();
  return import("@/lib/assistant-thread");
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A fetch that doesn't answer until told to. */
function heldFetch() {
  let answer!: (response: Response) => void;
  const fetch = vi.fn(
    () => new Promise<Response>((resolve) => (answer = resolve))
  );
  return { fetch, answer: (response: Response) => answer(response) };
}

const seed = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    role: (index % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
    content: `Line ${index}`,
  }));

beforeEach(() => {
  vi.stubGlobal("window", {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the store on the server", () => {
  test("never holds a conversation, since the module is shared by every request", async () => {
    vi.unstubAllGlobals();
    const store = await loadStore();

    store.seedThread("conv-a", seed(2));
    store.seedThreadIfEmpty("conv-b", seed(2));

    expect(store.getSnapshot()).toEqual(store.getServerSnapshot());
    expect(store.getSnapshot().conversationId).toBeNull();
  });
});

describe("seedThread", () => {
  test("gives every message a stable id, for keys", async () => {
    const store = await loadStore();

    store.seedThread("conv-a", [
      { id: "m1", role: "user", content: "Hi" },
      { role: "assistant", content: "Hello" },
    ]);

    const ids = store.getSnapshot().messages.map((message) => message.id);
    expect(ids[0]).toBe("m1");
    expect(new Set(ids).size).toBe(2);
  });

  test("takes the server's copy of the same chat when it has more lines", async () => {
    const store = await loadStore();
    store.seedThread("conv-a", seed(2));

    store.seedThread("conv-a", seed(4));

    expect(store.getSnapshot().messages).toHaveLength(4);
  });

  test("ignores an older, shorter copy of the same chat", async () => {
    const store = await loadStore();
    store.seedThread("conv-a", seed(4));
    const before = store.getSnapshot();

    store.seedThread("conv-a", seed(2));

    expect(store.getSnapshot()).toBe(before);
  });

  test("is a no-op for the thread already showing, so it is safe during render", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.seedThread("conv-a", seed(2));
    store.subscribe(listener);

    store.seedThread("conv-a", seed(2));

    expect(listener).not.toHaveBeenCalled();
  });

  test("doesn't replace a chat with a reply on its way", async () => {
    const store = await loadStore();
    const held = heldFetch();
    vi.stubGlobal("fetch", held.fetch);
    store.seedThread("conv-a", seed(2));

    const sending = store.sendMessage("And then?");
    store.seedThread("conv-a", seed(4));

    expect(store.getSnapshot().isThinking).toBe(true);
    expect(store.getSnapshot().messages).toHaveLength(3);

    held.answer(jsonResponse(200, { reply: "Then this.", conversationId: "conv-a" }));
    await sending;

    expect(store.getSnapshot().messages.map((m) => m.content)).toEqual([
      "Line 0",
      "Line 1",
      "And then?",
      "Then this.",
    ]);
  });
});

describe("seedThreadIfEmpty", () => {
  test("doesn't take over a first message still on its way", async () => {
    const store = await loadStore();
    vi.stubGlobal("fetch", heldFetch().fetch);

    void store.sendMessage("Hello");
    store.seedThreadIfEmpty("conv-latest", seed(2));

    expect(store.getSnapshot().conversationId).toBeNull();
    expect(store.getSnapshot().messages.map((m) => m.content)).toEqual([
      "Hello",
    ]);
  });
});

describe("sendMessage — switching threads while waiting", () => {
  test("drops a late reply for a thread the student has left", async () => {
    const store = await loadStore();
    const held = heldFetch();
    vi.stubGlobal("fetch", held.fetch);
    store.seedThread("conv-a", seed(2));

    const sending = store.sendMessage("Question for A");
    store.seedThread("conv-b", seed(2));
    held.answer(jsonResponse(200, { reply: "Answer for A", conversationId: "conv-a" }));
    await sending;

    const state = store.getSnapshot();
    expect(state.conversationId).toBe("conv-b");
    expect(state.messages.map((m) => m.content)).toEqual(["Line 0", "Line 1"]);
  });

  test("lets the new thread send at once, and the old reply can't unlock it early", async () => {
    const store = await loadStore();
    const first = heldFetch();
    vi.stubGlobal("fetch", first.fetch);
    store.seedThread("conv-a", seed(2));
    const sendingA = store.sendMessage("Question for A");

    store.seedThread("conv-b", seed(2));
    expect(store.getSnapshot().isThinking).toBe(false);

    const second = heldFetch();
    vi.stubGlobal("fetch", second.fetch);
    const sendingB = store.sendMessage("Question for B");

    first.answer(jsonResponse(200, { reply: "Answer for A", conversationId: "conv-a" }));
    await sendingA;

    // B is still waiting, so a second send must still be refused.
    expect(store.getSnapshot().isThinking).toBe(true);

    second.answer(jsonResponse(200, { reply: "Answer for B", conversationId: "conv-b" }));
    await sendingB;
    expect(store.getSnapshot().messages.at(-1)?.content).toBe("Answer for B");
  });
});

describe("forgetThread", () => {
  test("clears the thread being deleted", async () => {
    const store = await loadStore();
    store.seedThread("conv-a", seed(2));

    store.forgetThread("conv-a");

    expect(store.getSnapshot()).toMatchObject({
      conversationId: null,
      messages: [],
    });
  });

  test("leaves a different open thread alone", async () => {
    const store = await loadStore();
    store.seedThread("conv-a", seed(2));

    store.forgetThread("conv-b");

    expect(store.getSnapshot().conversationId).toBe("conv-a");
  });

  test("lets the layout seed the latest thread afterwards", async () => {
    const store = await loadStore();
    store.seedThread("conv-a", seed(2));
    store.forgetThread("conv-a");

    store.seedThreadIfEmpty("conv-b", seed(2));

    expect(store.getSnapshot().conversationId).toBe("conv-b");
  });
});

describe("sendMessage — what the student is told when it fails", () => {
  test("shows the server's own message when it sent one", async () => {
    const store = await loadStore();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(401, { error: "Your session has ended. Sign in again." })
      )
    );

    await store.sendMessage("Hello");

    expect(store.getSnapshot()).toMatchObject({
      error: "Your session has ended. Sign in again.",
      messages: [],
      isThinking: false,
    });
  });

  test("calls a response that isn't JSON the assistant being unavailable, not the connection", async () => {
    const store = await loadStore();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>Sign in</html>", { status: 200 }))
    );

    await store.sendMessage("Hello");

    expect(store.getSnapshot().error).toBe(store.UNAVAILABLE_ERROR);
  });

  test("blames the connection only when nothing answered", async () => {
    const store = await loadStore();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );

    await store.sendMessage("Hello");

    expect(store.getSnapshot()).toMatchObject({
      error: store.CONNECTION_ERROR,
      messages: [],
      isThinking: false,
    });
  });
});
