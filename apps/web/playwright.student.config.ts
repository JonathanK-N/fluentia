import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/student", workers: 1, timeout: 90_000,
  use: { baseURL: "http://127.0.0.1:3101", trace: "off" },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit-mobile", use: { browserName: "webkit", viewport: {width: 390, height: 844} } },
  ],
  webServer: [
    { command: `${process.env.E2E_PYTHON || "python"} ../api/manage.py runserver 127.0.0.1:8000 --noreload`, url: "http://127.0.0.1:8000/api/v1/health/", reuseExistingServer: false },
    { command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3101", url: "http://127.0.0.1:3101", reuseExistingServer: false },
  ],
  reporter: [["list"], ["json", {outputFile: "test-results/student-results.json"}]],
});
