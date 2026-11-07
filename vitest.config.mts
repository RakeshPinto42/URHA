import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // "server-only" throws outside React Server Components; the DAL is tested directly.
      "server-only": path.resolve(__dirname, "test/empty.ts"),
    },
  },
  test: { environment: "node", include: ["test/**/*.test.ts"], env: { URHA_DB_PATH: ":memory:" } },
});
