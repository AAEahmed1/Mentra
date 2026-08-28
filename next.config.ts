import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
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

  // Server-side source maps are deleted after upload rather than shipped.
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
