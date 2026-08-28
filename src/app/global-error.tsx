"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import "./globals.css";

/**
 * The root layout itself failed, so this replaces it — which means it owns its
 * own html and body, and cannot rely on the font or theme the layout sets up.
 * It is deliberately the plainest surface in the app: the one screen that has
 * to work when nothing else did.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 px-6 py-16">
          <div className="border-l border-primary pl-5">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Mentra couldn&apos;t start.
            </h1>
            <p className="mt-2 max-w-[55ch] text-sm text-muted-foreground">
              This one is on us, and it has been reported. Your courses, work
              and notes are untouched.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => retry()}
              className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Reload Mentra
            </button>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Reference {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
