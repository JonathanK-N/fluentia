/** Pilote étudiant : variantes, clavier et états. Propriétaire : Jonathan Kakesa. */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
test("dashboard aux sept largeurs sans données réelles", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const checks = [];
  for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/apercu/etudiant");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("main")).toHaveAttribute(
      "data-scenario",
      "empty",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const clipped = await page
      .locator("main h1,main h2,main h3,main button,header a")
      .evaluateAll((items) =>
        items
          .filter(
            (el) =>
              el.getClientRects().length && el.scrollWidth > el.clientWidth + 1,
          )
          .map((el) => el.textContent),
      );
    expect(clipped).toEqual([]);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`etudiant-${width}.png`),
      fullPage: true,
    });
    checks.push({ width, overflow: false, scenario: "empty" });
  }
  expect(errors).toEqual([]);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await expect(page.locator(".student-preview")).toHaveCSS(
    "color-scheme",
    "light",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await writeFile(
    info.outputPath("responsive.json"),
    JSON.stringify(checks, null, 2),
  );
});
test("dashboard : exemple rempli, erreur et dialogue sans fonction fictivement opérationnelle", async ({
  page,
}, info) => {
  await page.goto("/apercu/etudiant");
  await page.getByText("Options de l’aperçu", { exact: true }).click();
  await page
    .getByRole("button", { name: "Exemple rempli", exact: true })
    .click();
  await expect(
    page.getByText("Exemple rempli · Données fictives"),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveAccessibleName(
    "Activités de démonstration — aucun résultat personnel",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: info.outputPath("etudiant-exemple.png"),
    fullPage: true,
  });
  const error = page.getByRole("button", {
    name: "Afficher l’état indisponible",
  });
  await error.click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: info.outputPath("etudiant-indisponible.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await expect(error).toBeFocused();
  const resume = page.getByRole("button", {
    name: "Voir l’exemple de reprise",
  });
  await resume.click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(
    "Reprise d’une activité — exemple",
  );
  await page.keyboard.press("Escape");
  await expect(resume).toBeFocused();
  await error.click();
  const options = page.getByText("Options de l’aperçu", { exact: true });
  await options.click();
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await expect(options).toBeFocused();
  await page.setViewportSize({ width: 375, height: 900 });
  await page.locator(".student-skill-grid .student-action").first().hover();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const history = page.getByRole("region", {
    name: "Historique des activités de démonstration",
  });
  await history.focus();
  await expect(history).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: info.outputPath("etudiant-exemple-mobile.png"),
    fullPage: true,
  });
  expect(await page.locator("audio,video,canvas,iframe").count()).toBe(0);
});
test("dashboard : navigation mobile et lien d’évitement", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/apercu/etudiant");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Aller au contenu" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const menu = page.locator(".student-mobile-menu > summary");
  await menu.click();
  await expect(
    page.getByRole("navigation", { name: "Navigation étudiante" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Progression", exact: true }).click();
  await expect(page).toHaveURL(/#progression$/);
  await expect(
    page.getByRole("navigation", { name: "Navigation étudiante" }),
  ).not.toBeVisible();
  await menu.click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
