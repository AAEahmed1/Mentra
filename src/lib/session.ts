import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/**
 * The signed-in session, or null.
 *
 * Reads the Cookie header from `cookies()` rather than passing `headers()`
 * straight through. When a server action replaces the session cookie — as
 * changing a password does — Next re-renders the page in the same request.
 * `headers()` still carries the cookie the browser sent, which now names a
 * deleted session; `cookies()` reflects what the action set.
 */
export async function getSession() {
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("cookie", (await cookies()).toString());
  return auth.api.getSession({ headers: requestHeaders });
}

export async function requireUserId(): Promise<string> {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return session.user.id;
}
