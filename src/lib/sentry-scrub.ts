import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Query parameters that are safe to send with an error.
 *
 * Everything else is dropped rather than allowed, because a query string on
 * this app can carry what a student typed — `?q=` on the notes search is their
 * own words.
 */
const SAFE_QUERY_PARAMS = new Set(["minutes"]);

/**
 * Strips a student's own content out of an error report before it leaves.
 *
 * Mentra holds coursework, private notes and the whole conversation with the
 * assistant: the assistant request body is literally what the student typed.
 * None of that is needed to debug a crash, and all of it would be sitting in a
 * third party's dashboard if we sent events unfiltered. What survives is where
 * it broke and what broke — never what was being said when it did.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
    event.request.query_string = undefined;

    if (event.request.url) {
      event.request.url = safeUrl(event.request.url);
    }
  }

  // Navigation breadcrumbs carry the same URLs, so they need the same trim.
  event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) =>
    breadcrumb.data?.url
      ? {
          ...breadcrumb,
          data: { ...breadcrumb.data, url: safeUrl(String(breadcrumb.data.url)) },
        }
      : breadcrumb
  );

  return event;
}

function safeUrl(raw: string): string {
  try {
    const url = new URL(raw, "http://local");
    for (const key of [...url.searchParams.keys()]) {
      if (!SAFE_QUERY_PARAMS.has(key)) url.searchParams.delete(key);
    }
    return raw.startsWith("http") ? url.toString() : url.pathname + url.search;
  } catch {
    // An unparseable URL is not worth guessing at; the path is not that
    // valuable and the risk of shipping content is.
    return "[unparseable]";
  }
}
