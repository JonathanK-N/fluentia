/** Validation de production multi-moteurs. Propriétaire : Jonathan Kakesa. */
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 120_000,
  use: {
    baseURL: process.env.FLUENTIA_PREVIEW_URL || "http://127.0.0.1:3100",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    ...(process.env.FLUENTIA_CHROMIUM_EXECUTABLE
      ? {
          launchOptions: {
            executablePath: process.env.FLUENTIA_CHROMIUM_EXECUTABLE,
          },
        }
      : {}),
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer:
    process.env.FLUENTIA_PREVIEW_URL && !process.env.CI
      ? undefined
      : {
          command:
            "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100",
          url: "http://127.0.0.1:3100",
          reuseExistingServer: false,
        },
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
});
