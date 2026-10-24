/** Accueil, comportements et repli sans JS. Propriétaire : Jonathan Kakesa. */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Voice : états, pause, erreur, fin, focus et absence de capture", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => {
          throw new Error("Capture micro interdite dans la démonstration");
        },
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#voice");
  const stage = page.locator(".voice-stage");
  const status = stage.getByRole("status");
  await stage.getByRole("button", { name: /Lancer/ }).click();
  await expect(status).toHaveAttribute("data-voice-state", "listening");
  await expect(
    stage.getByRole("button", { name: /Étape suivante/ }),
  ).toBeFocused();
  await stage.getByRole("button", { name: /Étape suivante/ }).click();
  await expect(status).toHaveAttribute("data-voice-state", "analysis");
  await stage.getByRole("button", { name: "Mettre en pause" }).click();
  await expect(status).toHaveAttribute("data-voice-state", "paused");
  await stage.getByRole("button", { name: "Reprendre la démo" }).click();
  await expect(status).toHaveAttribute("data-voice-state", "analysis");
  await stage.getByRole("button", { name: /Étape suivante/ }).click();
  await expect(status).toHaveAttribute("data-voice-state", "speaking");
  await stage.getByRole("button", { name: "Simuler une erreur" }).click();
  await expect(status).toHaveAttribute("data-voice-state", "error");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await stage.getByRole("button", { name: /Réessayer/ }).click();
  await stage.getByRole("button", { name: "Terminer la démo" }).click();
  await expect(
    stage.getByRole("button", { name: /Recommencer/ }),
  ).toBeFocused();
  await expect(status).toHaveAttribute("data-voice-state", "ended");
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker.getRegistrations().then((items) => items.length),
    ),
  ).toBe(0);
  expect(errors).toEqual([]);
});
test("navigation mobile, Échap et destinations réelles", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const menu = page.locator(".landing-mobile-menu > summary");
  await menu.click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Navigation mobile" }),
  ).not.toBeVisible();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Navigation mobile" })
    .getByRole("link", { name: /Connexion et inscription/ })
    .click();
  await expect(page).toHaveURL(/#disponibilite$/);
  await expect(
    page.getByRole("heading", { name: /Une voix qui s’affirme/ }),
  ).toBeVisible();
  expect(
    await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links
          .filter(
            (link) =>
              !document.getElementById(link.getAttribute("href")!.slice(1)),
          )
          .map((link) => link.getAttribute("href")),
      ),
  ).toEqual([]);
});
test("FAQ au clavier, conseil et prix non définitifs", async ({ page }) => {
  await page.goto("/");
  const question = page
    .locator(".faq-list summary")
    .filter({ hasText: "La démonstration Voice" });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".faq-list details[open]")).toContainText("Non.");
  await page.keyboard.press("Space");
  await expect(page.locator(".faq-list details[open]")).toHaveCount(0);
  await page.getByRole("button", { name: /Voir le conseil/ }).click();
  await expect(page.locator(".coach-response")).toContainText(
    "Retour prédéfini",
  );
  await expect(page.getByText("Prix à confirmer", { exact: true })).toHaveCount(
    3,
  );
  expect(
    await page.locator("form,input,iframe,audio,video,canvas").count(),
  ).toBe(0);
});
test("mouvement réduit et pause manuelle conservent les contenus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const orb = page.locator(".hero-visual .fluentia-orb");
  await expect(orb).toHaveAttribute("data-animated", "true");
  const pause = page.getByRole("button", {
    name: "Mouvement — suspendre les animations",
  });
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect(orb).toHaveAttribute("data-animated", "false");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  const card = page.locator(".skill-card").first();
  await card.hover();
  await expect(card).toHaveCSS("transform", "none");
  await page.evaluate(() => window.scrollTo(0, 0));
  await pause.click();
  await expect(orb).toHaveAttribute("data-animated", "true");
  await page.locator("#voice").scrollIntoViewIfNeeded();
  await expect(orb).toHaveAttribute("data-animated", "false");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(orb).toHaveAttribute("data-animated", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(orb).toHaveAttribute("data-animated", "false");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: /Lancer la démo/ }).click();
  await expect(page.locator("[data-voice-state]")).toHaveAttribute(
    "data-voice-state",
    "listening",
  );
});
test("lecture et FAQ disponibles sans JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Maîtrisez",
    );
    await expect(
      page.getByRole("heading", { name: "Les bonnes questions." }),
    ).toBeVisible();
    await page.locator(".faq-list summary").first().click();
    await expect(page.locator(".faq-list details[open]")).toContainText("TCF");
    await expect(page.locator(".orb-body").first()).toBeVisible();
  } finally {
    await context.close();
  }
});
test("géométrie des cartes aux tailles intermédiaires", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 600, 900, 1280, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const overlaps = await page
      .locator(
        ".skills-grid,.pricing-grid,.preview-stats,.preview-cards,.journey-grid",
      )
      .evaluateAll(
        (grids) =>
          grids.flatMap((grid) => {
            const boxes = [...grid.children].map((child) =>
              child.getBoundingClientRect(),
            );
            return boxes.flatMap((a, i) =>
              boxes
                .slice(i + 1)
                .filter(
                  (b) =>
                    Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
                    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
                ),
            );
          }).length,
      );
    expect(overlaps, String(width)).toBe(0);
  }
});
