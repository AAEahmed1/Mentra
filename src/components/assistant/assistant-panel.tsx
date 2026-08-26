"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { role: "user" | "assistant"; content: string };

const OPENING_PROMPTS = [
  "What should I do tonight?",
  "I only have 45 minutes — what's worth starting?",
  "What's overdue?",
];

export function AssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isThinking]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setDraft("");
    setError(null);
    setIsThinking(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20) }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "The assistant is unavailable right now.");
        return;
      }

      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Couldn't reach the assistant. Check your connection.");
    } finally {
      setIsThinking(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-40 shadow-[0_1px_2px_oklch(0_0_0/0.06),0_8px_24px_-8px_oklch(0_0_0/0.28)]"
      >
        Ask Mentra
      </Button>
    );
  }

  return (
    <aside
      aria-label="Mentra assistant"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-card shadow-[0_1px_2px_oklch(0_0_0/0.06),0_12px_28px_-10px_oklch(0_0_0/0.22)]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border bg-cardstock px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex shrink-0 flex-col gap-1.5 opacity-40"
          >
            <span className="size-1 rounded-full bg-foreground" />
            <span className="size-1 rounded-full bg-foreground" />
            <span className="size-1 rounded-full bg-foreground" />
          </div>
          <div>
            <h2 className="font-serif text-base leading-snug font-semibold">
              Ask Mentra
            </h2>
            <p className="font-mono text-xs tabular-nums-mono text-muted-foreground">
              Reads your courses, tasks and notes
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Close
        </Button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-cardstock px-5 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Ask about your work and I&apos;ll look it up before answering.
            </p>
            <div className="flex flex-col items-start gap-2">
              {OPENING_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  className="rounded-lg border border-dashed border-border px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <li
                key={index}
                className={
                  message.role === "user"
                    ? "flex flex-col items-end gap-1"
                    : "flex flex-col gap-1"
                }
              >
                <span className="font-mono text-xs tracking-wide text-muted-foreground">
                  {message.role === "user" ? "You" : "Mentra"}
                </span>
                <p
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap"
                      : "text-sm whitespace-pre-wrap"
                  }
                >
                  {message.content}
                </p>
              </li>
            ))}
          </ul>
        )}

        {isThinking && (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Looking it up…
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
        className="flex items-center gap-2 border-t border-border px-5 py-4"
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ask Mentra
        </label>
        <Input
          id="assistant-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What should I do tonight?"
          autoComplete="off"
          disabled={isThinking}
        />
        <Button type="submit" size="sm" disabled={isThinking || !draft.trim()}>
          Send
        </Button>
      </form>
    </aside>
  );
}
