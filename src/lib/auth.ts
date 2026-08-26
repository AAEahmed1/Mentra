import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

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
});
