/** Accueil : navigation, liens, FAQ, mouvement et repli sans JS. Propriétaire : Jonathan Kakesa. */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("navigation mobile, Échap et destinations réelles", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const menu = page.locator(".landing-mobile-menu > summary");
  await menu.click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Navigation mobile" })).not.toBeVisible();
  await menu.click();
  await page.getByRole("navigation", { name: "Navigation mobile" }).getByRole("link", { name: /Connexion et inscription/ }).click();
  await expect(page).toHaveURL(/\/etudiant\/compte$/);
  await page.goto("/#tarifs");
  await expect(page.locator("#pricing-title")).toBeVisible();
  expect(
    await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links.filter((link) => !document.getElementById(link.getAttribute("href")!.slice(1))).map((link) => link.getAttribute("href")),
      ),
  ).toEqual([]);
});

test("l’inscription depuis l’accueil ouvre le formulaire d’inscription", async ({ page }) => {
  await page.goto("/");
  await page.locator(".home-hero").getByRole("link", { name: /Créer mon compte gratuit/ }).click();
  await expect(page).toHaveURL(/\/etudiant\/compte#inscription$/);
  await expect(page.getByRole("button", { name: "Inscription" })).toHaveAttribute("aria-pressed", "true");
});

test("FAQ au clavier, offres et accessibilité", async ({ page }) => {
  await page.goto("/");
  const question = page.locator(".faq-list summary").filter({ hasText: "Que devient ma voix" });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".faq-list details[open]")).toContainText("transcription");
  await page.keyboard.press("Space");
  await expect(page.locator(".faq-list details[open]")).toHaveCount(0);
  await expect(page.locator(".plan-card")).toHaveCount(2);
  await expect(page.getByText("19,99 $", { exact: true })).toBeVisible();
  expect(await page.locator("form,input,iframe,audio,video,canvas").count()).toBe(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("l’aperçu de l’oral s’arrête avec la pause manuelle et le mouvement réduit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const preview = page.locator(".session-preview");
  await expect(preview).toHaveAttribute("data-running", "true");
  const pause = page.getByRole("button", { name: "Mouvement — suspendre les animations" });
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toHaveAttribute("data-running", "false");
  await expect(preview.locator(".session-preview-lines li")).toHaveCount(5);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await pause.click();
  await expect(preview).toHaveAttribute("data-running", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(preview).toHaveAttribute("data-running", "false");
});

test("lecture et FAQ disponibles sans JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Préparez le TCF Canada");
    await expect(page.getByRole("heading", { name: "Vos questions, nos réponses." })).toBeVisible();
    await page.locator(".faq-list summary").first().click();
    await expect(page.locator(".faq-list details[open]")).toContainText("TCF");
  } finally {
    await context.close();
  }
});

test("géométrie des cartes aux tailles intermédiaires", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 600, 900, 1280, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const overlaps = await page.locator(".exam-grid,.plan-grid,.step-grid,.home-highlights,.task-timeline").evaluateAll(
      (grids) =>
        grids.flatMap((grid) => {
          const boxes = [...grid.children].map((child) => child.getBoundingClientRect());
          return boxes.flatMap((a, i) =>
            boxes
              .slice(i + 1)
              .filter((b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1),
          );
        }).length,
    );
    expect(overlaps, String(width)).toBe(0);
  }
});
