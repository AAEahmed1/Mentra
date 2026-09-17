import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Headers every response carries, pages and `/public` files alike.
 *
 * There is deliberately no Content-Security-Policy yet. Next's inline
 * bootstrap scripts need a nonce or hashes, and the Sentry tunnel and any
 * third-party origins have to be enumerated; a policy guessed at here would
 * either break the app or allow so much it protects nothing. That is a
 * decision to make on purpose, not a line to add in passing.
 */
const securityHeaders = [
  // Stops a browser guessing a file's type, so an uploaded or served text file
  // can never be reinterpreted as script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Paths on this app can carry a student's search terms; other sites only
  // need to know the request came from Mentra, not from which page.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing legitimately embeds Mentra, so framing is refused outright rather
  // than left open to clickjacking. Without a CSP this is the only lever.
  { key: "X-Frame-Options", value: "DENY" },
  // The app uses none of these, so an injected script cannot ask for them.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Two years, subdomains included. Not `preload`: joining the browser preload
  // list is effectively irreversible and applies to the whole registered
  // domain, which is not this config's call to make.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: "aaeahmed98",
  project: "javascript-nextjs",

  /*
    No `sentryUrl`. This organisation ingests events on Sentry's EU host
    (`.de.sentry.io` in the DSN), but an auth token carries its own region and
    that wins — setting the URL by hand only produces a warning on every build
    saying the token overrode it.
  */

  // Upload needs SENTRY_AUTH_TOKEN. Without it the build still succeeds and
  // errors still report; only the un-minifying is lost, so a missing token is
  // never a broken deploy.
  silent: !process.env.CI,

  // Browser source maps (everything under .next/static, which is publicly
  // served) are deleted after upload so the original source is not handed to
  // anyone who asks. Server maps stay on the server, where they are not served.
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },

  // Routes Sentry's own requests through this app's origin, so an ad blocker
  // cannot quietly swallow every error report from the browser.
  tunnelRoute: "/monitoring",

  /*
    `disableLogger` is deprecated in favour of a webpack treeshake option that
    Turbopack does not support, and this project builds with Turbopack — so
    there is nothing to set here rather than something to migrate.
  */
});
