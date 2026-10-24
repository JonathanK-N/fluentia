/** Tests DOM des interactions. Propriétaire : Jonathan Kakesa. */
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.tsx"],
  },
  oxc: { jsx: { runtime: "automatic" } },
});
