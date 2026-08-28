import * as Sentry from "@sentry/nextjs";

import { scrubEvent } from "@/lib/sentry-scrub";

/**
 * Browser observability. The DSN is public by design — it ships in this bundle
 * and only permits sending events, never reading them.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

/**
 * Lets Sentry see client-side navigations as transactions. Exported
 * unconditionally: without a DSN the SDK was never initialised and this is a
 * no-op, and a conditional export would be a build-time error rather than a
 * runtime one.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
