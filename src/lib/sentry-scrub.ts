import type { ErrorEvent, Event } from "@sentry/nextjs";

/**
 * The event `beforeSendTransaction` receives. @sentry/nextjs does not re-export
 * the SDK's own TransactionEvent type, and this is all that type adds to Event.
 */
export type TransactionEvent = Event & { type: "transaction" };

/**
 * Query parameters that are safe to send with an error.
 *
 * Everything else is dropped rather than allowed, because a query string on
 * this app can carry what a student typed — `?q=` on the notes search is their
 * own words.
 */
const SAFE_QUERY_PARAMS = new Set(["minutes"]);

/**
 * Span and breadcrumb data keys whose value is a whole URL or a path that can
 * carry a query string. `from` and `to` are how navigation breadcrumbs record
 * where the student went; the rest are the SDK's HTTP and OpenTelemetry span
 * attributes.
 */
const URL_KEYS = new Set([
  "url",
  "from",
  "to",
  "http.url",
  "http.target",
  "url.full",
  "url.path",
]);

/** Keys whose value is just the query string, leading `?` and all. */
const QUERY_KEYS = new Set(["http.query", "url.query"]);

/** Keys whose value is just the `#fragment`, which is never worth sending. */
const FRAGMENT_KEYS = new Set(["http.fragment", "url.fragment"]);

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
  return scrubShared(event);
}

/**
 * The same trim for performance data, which never passes through beforeSend.
 *
 * A transaction repeats the request, the breadcrumbs and — in every span that
 * fetched something or navigated — the URL again, split into `url.full`,
 * `http.query` and friends. Scrubbing errors alone would leave every search a
 * student ran readable in the performance view instead.
 */
export function scrubTransaction(event: TransactionEvent): TransactionEvent {
  scrubShared(event);

  if (event.transaction) {
    event.transaction = scrubText(event.transaction);
  }

  event.spans = event.spans?.map((span) => ({
    ...span,
    data: scrubData(span.data),
    ...(span.description ? { description: scrubText(span.description) } : {}),
  }));

  return event;
}

function scrubShared<T extends Event>(event: T): T {
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
    breadcrumb.data
      ? { ...breadcrumb, data: scrubData(breadcrumb.data) }
      : breadcrumb
  );

  // The root span's attributes are copied here, URL included.
  const trace = event.contexts?.trace;
  if (trace?.data) {
    trace.data = scrubData(trace.data);
  }
  if (typeof trace?.description === "string") {
    trace.description = scrubText(trace.description);
  }

  return event;
}

function scrubData<T extends Record<string, unknown>>(data: T): T {
  const scrubbed: Record<string, unknown> = { ...data };

  for (const [key, value] of Object.entries(scrubbed)) {
    if (FRAGMENT_KEYS.has(key)) {
      delete scrubbed[key];
    } else if (QUERY_KEYS.has(key) && typeof value === "string") {
      const query = safeQuery(value);
      if (query) scrubbed[key] = query;
      else delete scrubbed[key];
    } else if (URL_KEYS.has(key) && typeof value === "string") {
      scrubbed[key] = safeUrl(value);
    }
  }

  return scrubbed as T;
}

/**
 * Trims every URL inside free text such as a span description
 * (`GET https://…/notes?q=…`) or a transaction name, leaving the words around
 * it. Only tokens that are plainly a path or an absolute URL are touched, so a
 * SQL placeholder `?` in a database span survives.
 */
function scrubText(text: string): string {
  return text.replace(/(?:[a-z][a-z0-9+.-]*:\/\/|\/)\S*/gi, (token) =>
    /[?#]/.test(token) ? safeUrl(token) : token
  );
}

function safeQuery(raw: string): string {
  const params = new URLSearchParams(raw);
  for (const key of [...params.keys()]) {
    if (!SAFE_QUERY_PARAMS.has(key)) params.delete(key);
  }
  const kept = params.toString();
  return kept ? `?${kept}` : "";
}

function safeUrl(raw: string): string {
  try {
    const absolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
    const url = new URL(raw, "http://local");
    url.search = safeQuery(url.search);
    // A fragment is client-side state — it can hold anything the page put
    // there, and it never explains a server error.
    url.hash = "";
    url.username = "";
    url.password = "";
    return absolute ? url.toString() : url.pathname + url.search;
  } catch {
    // An unparseable URL is not worth guessing at; the path is not that
    // valuable and the risk of shipping content is.
    return "[unparseable]";
  }
}
