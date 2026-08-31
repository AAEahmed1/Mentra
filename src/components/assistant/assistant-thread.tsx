"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  getServerSnapshot,
  getSnapshot,
  sendMessage,
  subscribe,
} from "@/lib/assistant-thread";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OPENING_PROMPTS = [
  "What should I do tonight?",
  "I only have 45 minutes — what's worth starting?",
  "What's overdue?",
];

export function useThread() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * The transcript and its composer.
 *
 * Rendered twice — once in the floating panel, once on a chat page — against
 * the same store, so a message typed in either appears in both.
 */
export function AssistantThread({ variant }: { variant: "panel" | "page" }) {
  const { messages, isThinking, error } = useThread();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPanel = variant === "panel";

  useEffect(() => {
    if (!isPanel) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isThinking, isPanel]);

  function submit(text: string) {
    setDraft("");
    void sendMessage(text);
  }

  return (
    <>
      <div
        ref={scrollRef}
        className={
          isPanel
            ? "flex-1 overflow-y-auto px-5 py-4"
            : "flex-1 pb-6"
        }
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
                  onClick={() => submit(prompt)}
                  className="rounded-xs border border-rule-strong px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul
            className={
              isPanel
                ? "flex flex-col gap-4"
                : "flex max-w-[70ch] flex-col gap-5"
            }
          >
            {messages.map((message, index) => (
              <li
                key={index}
                // A turn arrives rather than appearing: the reply is the one
                // thing on this surface that happens, so it is the one thing
                // that moves.
                className={
                  message.role === "user"
                    ? "animate-turn flex flex-col items-end gap-1"
                    : "animate-turn flex flex-col gap-1"
                }
              >
                <span className="text-[0.6875rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  {message.role === "user" ? "You" : "Mentra"}
                </span>
                <p
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-xs bg-muted px-3 py-2 text-sm whitespace-pre-wrap"
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
          <p className="animate-working mt-4 text-xs italic text-muted-foreground">
            Looking it up…
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xs border border-destructive/45 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
        className={
          isPanel
            ? "flex items-center gap-2 border-t-2 border-rule-strong px-5 py-4"
            : "flex max-w-[70ch] items-center gap-2 border-t-2 border-rule-strong pt-4"
        }
      >
        <label htmlFor={`assistant-input-${variant}`} className="sr-only">
          Ask Mentra
        </label>
        <Input
          id={`assistant-input-${variant}`}
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
    </>
  );
}
