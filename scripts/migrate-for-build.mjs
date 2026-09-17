/**
 * Applies pending migrations as part of a build, except on Vercel previews.
 *
 * Every Vercel build runs `npm run build`, and a Preview deployment builds
 * with whatever DATABASE_URL its environment holds. If that is the production
 * database — easy to do, since Vercel copies variables across environments —
 * a branch that has not been reviewed would migrate production the moment it
 * was pushed. So previews skip migrating unless someone has explicitly given
 * the preview environment its own database and said so with
 * MIGRATE_ON_PREVIEW=1.
 *
 * Production builds, local builds and CI still migrate: there the database is
 * the one the build is for.
 *
 * Plain Node with no dependencies, because it runs before anything else in
 * the build and must not need a TypeScript toolchain to decide.
 */
import { spawnSync } from "node:child_process";

const log = (message) => console.log(`[migrate] ${message}`);

const vercelEnv = process.env.VERCEL_ENV;
const optedIn = process.env.MIGRATE_ON_PREVIEW === "1";

if (vercelEnv === "preview" && !optedIn) {
  log("Skipping `prisma migrate deploy`: this is a Vercel preview build.");
  log(
    "Previews may share the production database, so they never migrate it by " +
      "default. Set MIGRATE_ON_PREVIEW=1 on the Preview environment only if it " +
      "has its own database."
  );
  process.exit(0);
}

if (vercelEnv === "preview") {
  log("Running `prisma migrate deploy` on a preview build: MIGRATE_ON_PREVIEW=1.");
} else if (vercelEnv) {
  log(`Running \`prisma migrate deploy\` for the Vercel ${vercelEnv} build.`);
} else {
  log("Running `prisma migrate deploy` (not on Vercel: local or CI build).");
}

// `npx` resolves the project's own prisma binary; shell is needed on Windows
// for the .cmd shim and harmless elsewhere.
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  log(`Could not start prisma: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
