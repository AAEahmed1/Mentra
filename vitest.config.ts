import { loadEnv, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Where DATABASE_URL points when no test database is configured. `.invalid` is
 * reserved and never resolves, so a database test fails at connect time within
 * a moment instead of quietly reaching the application's own database.
 */
const NO_TEST_DATABASE = "postgres://test-database-url-not-set.invalid:5432/none";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * What makes two connection strings the same database: where it is and who
 * connects. Query parameters (`sslmode`, pool sizes) and the password change
 * how you connect, not what you connect to, so they are ignored — otherwise
 * appending `?sslmode=disable` would be enough to slip past the guard.
 */
function databaseIdentity(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    return [
      LOOPBACK_HOSTS.has(host) ? "loopback" : host,
      url.port || "5432",
      decodeURIComponent(url.pathname.replace(/^\//, "")) || "postgres",
      decodeURIComponent(url.username),
    ].join("|");
  } catch {
    return null;
  }
}

/**
 * The service tests are real integration tests — they create and delete rows.
 * They must never run against the database holding real student data, so the
 * suite refuses to start when TEST_DATABASE_URL points at the same database as
 * DATABASE_URL. Failing loudly here beats discovering the mistake as missing
 * rows later.
 *
 * With no TEST_DATABASE_URL at all, the pure unit tests still deserve to run,
 * so DATABASE_URL is pointed somewhere unreachable instead: every database test
 * fails fast, and none of them can touch the application's data.
 */
function resolveTestDatabaseUrl(env: Record<string, string>): string {
  const testUrl = env.TEST_DATABASE_URL?.trim();
  const appUrl = env.DATABASE_URL?.trim();

  if (!testUrl) {
    console.warn(
      "\n[vitest] TEST_DATABASE_URL is not set. Unit tests will run, but every " +
        "test that needs a database will fail: they write real rows, so they " +
        "need their own database. Create one locally with " +
        "`npx prisma dev --name mentra-test -d` and see docs/development.md.\n"
    );
    return NO_TEST_DATABASE;
  }

  const testIdentity = databaseIdentity(testUrl);
  if (!testIdentity) {
    throw new Error(
      "TEST_DATABASE_URL is not a valid connection URL, so it cannot be " +
        "checked against DATABASE_URL. Refusing to run the tests."
    );
  }

  if (
    appUrl &&
    (testUrl === appUrl || testIdentity === databaseIdentity(appUrl))
  ) {
    throw new Error(
      "TEST_DATABASE_URL points at the same database as DATABASE_URL. The " +
        "tests would create and delete rows in the application's own " +
        "database. Point TEST_DATABASE_URL at a separate database."
    );
  }

  return testUrl;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);
  process.env.DATABASE_URL = resolveTestDatabaseUrl(env);

  return {
    plugins: [tsconfigPaths()],
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
      // The service tests share one database and create fixtures with
      // overlapping shapes, so running files in parallel both exhausts a local
      // Postgres's connections and lets one file's cleanup race another's
      // fixtures. Serial is fast enough against a local server.
      fileParallelism: false,
    },
  };
});
