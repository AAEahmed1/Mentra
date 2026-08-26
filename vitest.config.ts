import { loadEnv, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * The service tests are real integration tests — they create and delete rows.
 * They must never run against the database holding real student data, so the
 * suite refuses to start unless TEST_DATABASE_URL is set and points somewhere
 * other than DATABASE_URL. Failing loudly here beats discovering the mistake
 * as missing rows later.
 */
function resolveTestDatabaseUrl(env: Record<string, string>): string {
  const testUrl = env.TEST_DATABASE_URL?.trim();
  const appUrl = env.DATABASE_URL?.trim();

  if (!testUrl) {
    throw new Error(
      "TEST_DATABASE_URL is not set. The tests write real rows, so they need " +
        "their own database — see .env.example. Start one locally with " +
        "`npx prisma dev start mentra`."
    );
  }

  if (appUrl && testUrl === appUrl) {
    throw new Error(
      "TEST_DATABASE_URL is the same as DATABASE_URL. The tests would create " +
        "and delete rows in the application's own database. Point " +
        "TEST_DATABASE_URL at a separate database."
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
