import { loadEnv, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [tsconfigPaths()],
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
