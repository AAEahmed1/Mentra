import * as Sentry from "@sentry/nextjs";

import { scrubEvent, scrubTransaction } from "@/lib/sentry-scrub";

/**
 * Server and edge observability.
 *
 * `register` runs once per server instance before it takes requests, and
 * `onRequestError` is how this Next version reports a server-side throw — the
 * older `sentry.server.config.ts` convention does not apply here.
 */
export function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // One student, so every trace is affordable and every trace is useful.
    tracesSampleRate: 1,
    // Never attach IP, headers or user identity. See scrubEvent for why.
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    // Traces skip beforeSend entirely, and carry the same URLs in more places.
    beforeSendTransaction: scrubTransaction,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

export const onRequestError = Sentry.captureRequestError;
