"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * A page failed to render.
 *
 * Same stock, plates and rules as the entry surfaces: this is Mentra
 * speaking, not a browser default. The digest is shown because it is the one
 * thing that connects what the student saw to what was recorded.
 */
export default function Error({
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
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">
          That page didn&apos;t load.
        </h1>
        <p className="mt-2 max-w-[55ch] text-sm text-muted-foreground">
          Something broke on our side, not yours. Nothing you had saved is
          affected — it&apos;s all still in your account.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-xs bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xs border border-rule-strong px-3.5 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Back to today
        </Link>
      </div>

      {error.digest && (
        <p data-figures className="text-xs text-muted-foreground">
          Reference {error.digest}
        </p>
      )}
    </main>
  );
}
