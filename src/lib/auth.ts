import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Google is only registered when both halves of the credential are present.
 * Declaring it with empty strings makes Better Auth warn on every boot and
 * leaves a sign-in button that can only fail.
 */
export const hasGoogleAuth = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Vercel serves the app from its deployment URL as well as any custom
  // domain; both must be trusted or the OAuth callback is rejected.
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter((origin): origin is string => Boolean(origin)),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: hasGoogleAuth
    ? {
        google: {
          clientId: googleClientId as string,
          clientSecret: googleClientSecret as string,
        },
      }
    : {},
  /*
    Rate limits live in the database (the rate_limit table), not in memory.
    Every Vercel instance has its own memory, so an in-memory counter gives a
    guesser a fresh allowance on each warm instance; a shared table does not.
    Enabled everywhere, not only in production, so the limits are exercised
    locally before they matter.

    Keys are client IP + path. On Vercel `x-forwarded-for` is set by the edge
    to a single address, which is what Better Auth trusts by default.

    The numbers, per IP:
    - sign-in: 10 tries per 5 minutes. Enough for a student fumbling a
      password several times; caps a guesser at ~120 attempts an hour instead
      of the built-in 3-per-10-seconds (~1,000 an hour).
    - sign-up: 5 accounts per hour. A person makes one; this only bites a
      script creating them in bulk.
    - change-password: 5 per 10 minutes. It checks the current password, so it
      is a second guessing endpoint for anyone holding a session cookie. (The
      profile form calls auth.api directly from a server action, which Better
      Auth does not rate limit; this covers the public HTTP endpoint.)
    Everything else keeps Better Auth's default of 100 per 10 seconds.
  */
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 300, max: 10 },
      "/sign-up/email": { window: 3600, max: 5 },
      "/change-password": { window: 600, max: 5 },
    },
  },
  // Server actions that call auth.api (changing a password replaces the
  // session) can only set cookies through Next's cookies() API. Without this
  // plugin the new session cookie is dropped and the student is signed out.
  // Must stay the last plugin.
  plugins: [nextCookies()],
});
