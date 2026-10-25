/** Zoom navigateur Chromium à 200 %, sans substitution par un zoom CSS. Propriétaire : Jonathan Kakesa. */
import { test, expect, chromium } from "@playwright/test";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
test("zoom navigateur réel à 200 %", async ({}, info) => {
  test.skip(
    info.project.name !== "chromium",
    "L’API d’extension de zoom utilisée est propre à Chromium.",
  );
  const extension = resolve("tests/fixtures/zoom");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    viewport: null,
    args: [
      "--window-size=1440,1000",
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
  });
  try {
    const worker =
      context.serviceWorkers()[0] ||
      (await context.waitForEvent("serviceworker"));
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:3100/design-system");
    const initialWidth = await page.evaluate(() => innerWidth);
    const zoom = await worker.evaluate(async () => {
      const api = (
        globalThis as unknown as {
          chrome: {
            tabs: {
              query: (q: { url: string }) => Promise<{ id: number }[]>;
              setZoom: (id: number, zoom: number) => Promise<void>;
              getZoom: (id: number) => Promise<number>;
            };
          };
        }
      ).chrome;
      const [tab] = await api.tabs.query({ url: "http://127.0.0.1:3100/*" });
      await api.tabs.setZoom(tab.id, 2);
      return api.tabs.getZoom(tab.id);
    });
    expect(zoom).toBe(2);
    await expect
      .poll(() => page.evaluate(() => innerWidth))
      .toBeLessThanOrEqual(Math.ceil(initialWidth / 2) + 1);
    for (const route of ["/design-system", "/", "/apercu/etudiant"]) {
      await page.goto("http://127.0.0.1:3100" + route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    await page.screenshot({
      path: info.outputPath("zoom-200.png"),
      fullPage: true,
    });
    await writeFile(
      info.outputPath("zoom.json"),
      JSON.stringify(
        {
          zoom,
          initialWidth,
          zoomedWidth: await page.evaluate(() => innerWidth),
        },
        null,
        2,
      ),
    );
  } finally {
    await context.close();
  }
});
