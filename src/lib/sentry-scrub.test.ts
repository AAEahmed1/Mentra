import { describe, expect, test } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";

import { scrubEvent } from "@/lib/sentry-scrub";

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
