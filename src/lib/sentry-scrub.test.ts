import { describe, expect, test } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";

import {
  scrubEvent,
  scrubTransaction,
  type TransactionEvent,
} from "@/lib/sentry-scrub";

function eventWith(request: ErrorEvent["request"]): ErrorEvent {
  return { type: undefined, request } as ErrorEvent;
}

describe("scrubEvent — keeping the student's own words out of Sentry", () => {
  test("drops the request body, which on this app is what they typed", () => {
    const event = eventWith({
      url: "http://localhost:3000/api/assistant",
      data: { message: "I am struggling with my placement and can't cope" },
    });

    expect(scrubEvent(event).request?.data).toBeUndefined();
  });

  test("drops cookies, which carry the session", () => {
    const event = eventWith({ cookies: { session: "secret-token" } });

    expect(scrubEvent(event).request?.cookies).toBeUndefined();
  });

  test("drops headers, which carry auth and the user agent", () => {
    const event = eventWith({ headers: { authorization: "Bearer secret" } });

    expect(scrubEvent(event).request?.headers).toBeUndefined();
  });

  test("strips a note search out of the url", () => {
    const event = eventWith({
      url: "http://localhost:3000/notes?q=antidepressant%20dosage",
    });

    const scrubbed = scrubEvent(event).request?.url ?? "";

    expect(scrubbed).not.toContain("antidepressant");
    expect(scrubbed).toContain("/notes");
  });

  test("keeps the parameters that explain a bug rather than describe a person", () => {
    const event = eventWith({ url: "http://localhost:3000/dashboard?minutes=30" });

    expect(scrubEvent(event).request?.url).toContain("minutes=30");
  });

  test("strips search terms from navigation breadcrumbs too", () => {
    // The URL is recorded twice — once as the request, once as the trail that
    // led there. Scrubbing one and not the other leaks it anyway.
    const event = {
      type: undefined,
      breadcrumbs: [
        {
          category: "navigation",
          data: { url: "/notes?q=my%20private%20search" },
        },
      ],
    } as ErrorEvent;

    const url = String(scrubEvent(event).breadcrumbs?.[0].data?.url);

    expect(url).not.toContain("private");
    expect(url).toContain("/notes");
  });

  test("keeps the path, which is the part worth debugging", () => {
    const event = eventWith({ url: "http://localhost:3000/chats/abc123" });

    expect(scrubEvent(event).request?.url).toContain("/chats/abc123");
  });

  test("still strips a malformed url rather than passing it through", () => {
    // Anything the URL parser accepts against a base gets the same treatment;
    // the catch in safeUrl is defence for the rest, not a normal path.
    const event = eventWith({ url: "not a url?q=private" });

    expect(scrubEvent(event).request?.url).not.toContain("private");
  });

  test("leaves an event with no request alone", () => {
    expect(() => scrubEvent({ type: undefined } as ErrorEvent)).not.toThrow();
  });
});

describe("scrubEvent — the parts of a URL beyond the query", () => {
  test("drops the #fragment from an absolute url", () => {
    const event = eventWith({
      url: "https://mentra.app/notes/abc#my%20private%20heading",
    });

    expect(scrubEvent(event).request?.url).toBe("https://mentra.app/notes/abc");
  });

  test("scrubs where a navigation breadcrumb came from and went to", () => {
    // History breadcrumbs record `from` and `to`, not `url`.
    const event = {
      type: undefined,
      breadcrumbs: [
        {
          category: "navigation",
          timestamp: 1,
          data: {
            from: "/notes?q=panic%20attacks",
            to: "/dashboard?minutes=30#focus",
          },
        },
      ],
    } as ErrorEvent;

    const data = scrubEvent(event).breadcrumbs?.[0].data;

    expect(data).toEqual({ from: "/notes", to: "/dashboard?minutes=30" });
  });

  test("scrubs fetch breadcrumbs, which also record the query on its own", () => {
    const event = {
      type: undefined,
      breadcrumbs: [
        {
          category: "fetch",
          type: "http",
          timestamp: 1,
          data: {
            method: "GET",
            url: "https://mentra.app/api/notes?q=grief",
            "http.query": "?q=grief",
            "http.fragment": "#top",
            status_code: 200,
          },
        },
      ],
    } as ErrorEvent;

    const data = scrubEvent(event).breadcrumbs?.[0].data;

    expect(data).toEqual({
      method: "GET",
      url: "https://mentra.app/api/notes",
      status_code: 200,
    });
  });
});

/** Shaped like what the browser SDK sends for a pageload on the notes search. */
function notesSearchTransaction(): TransactionEvent {
  return {
    type: "transaction",
    transaction: "/notes?q=eating%20disorder",
    request: {
      url: "https://mentra.app/notes?q=eating%20disorder&minutes=30#results",
      headers: { "User-Agent": "Mozilla/5.0", Cookie: "session=secret" },
      cookies: { session: "secret" },
      query_string: "q=eating%20disorder",
    },
    contexts: {
      trace: {
        trace_id: "a".repeat(32),
        span_id: "b".repeat(16),
        op: "pageload",
        data: {
          "sentry.op": "pageload",
          "url.full": "https://mentra.app/notes?q=eating%20disorder",
        },
      },
    },
    breadcrumbs: [
      {
        category: "navigation",
        timestamp: 1,
        data: { from: "/dashboard", to: "/notes?q=eating%20disorder" },
      },
    ],
    spans: [
      {
        span_id: "c".repeat(16),
        trace_id: "a".repeat(32),
        start_timestamp: 1,
        timestamp: 2,
        op: "http.client",
        description: "GET https://mentra.app/api/notes?q=eating%20disorder",
        data: {
          "http.method": "GET",
          url: "https://mentra.app/api/notes?q=eating%20disorder",
          "http.url": "https://mentra.app/api/notes?q=eating%20disorder",
          "url.full": "https://mentra.app/api/notes?q=eating%20disorder#x",
          "http.query": "?q=eating%20disorder",
          "url.query": "?q=eating%20disorder&minutes=30",
          "http.fragment": "#x",
          "server.address": "mentra.app",
        },
      },
      {
        span_id: "d".repeat(16),
        trace_id: "a".repeat(32),
        start_timestamp: 1,
        timestamp: 2,
        op: "db.query",
        description: "SELECT * FROM note WHERE title = ?",
        data: { "db.system": "postgresql" },
      },
    ],
  };
}

describe("scrubTransaction — performance data gets the same treatment", () => {
  test("strips the search from the transaction name", () => {
    const scrubbed = scrubTransaction(notesSearchTransaction());

    expect(scrubbed.transaction).toBe("/notes");
  });

  test("trims the request url and drops headers, cookies and query string", () => {
    const { request } = scrubTransaction(notesSearchTransaction());

    expect(request?.url).toBe("https://mentra.app/notes?minutes=30");
    expect(request?.headers).toBeUndefined();
    expect(request?.cookies).toBeUndefined();
    expect(request?.query_string).toBeUndefined();
  });

  test("scrubs every url-carrying attribute on an http span", () => {
    const span = scrubTransaction(notesSearchTransaction()).spans?.[0];

    expect(span?.description).toBe("GET https://mentra.app/api/notes");
    expect(span?.data).toEqual({
      "http.method": "GET",
      url: "https://mentra.app/api/notes",
      "http.url": "https://mentra.app/api/notes",
      "url.full": "https://mentra.app/api/notes",
      "url.query": "?minutes=30",
      "server.address": "mentra.app",
    });
  });

  test("leaves a database span's placeholders alone", () => {
    const span = scrubTransaction(notesSearchTransaction()).spans?.[1];

    expect(span?.description).toBe("SELECT * FROM note WHERE title = ?");
  });

  test("scrubs the root span's data and the breadcrumbs", () => {
    const scrubbed = scrubTransaction(notesSearchTransaction());

    expect(scrubbed.contexts?.trace?.data?.["url.full"]).toBe(
      "https://mentra.app/notes"
    );
    expect(scrubbed.breadcrumbs?.[0].data?.to).toBe("/notes");
  });

  test("leaves nothing of what was searched anywhere in the event", () => {
    const serialized = JSON.stringify(
      scrubTransaction(notesSearchTransaction())
    );

    expect(serialized).not.toContain("eating");
    expect(serialized).not.toContain("secret");
  });
});
