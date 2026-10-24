/** Clavier, thèmes et limites PWA réelles. Propriétaire : Jonathan Kakesa. */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
for (const theme of ["light", "dark"] as const) {
 test(`contrastes et focus — ${theme}`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  for (const route of ["/", "/design-system"]) {
   await page.goto(route); await page.keyboard.press("Tab");
   const skip = page.getByRole("link", { name: "Aller au contenu" });
   await expect(skip).toBeFocused(); await expect(skip).toHaveCSS("opacity", "1");
   await page.keyboard.press("Enter"); await expect(page).toHaveURL(/#contenu$/);
   expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
   expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  }
  const input = page.getByLabel("Prénom"); await input.focus();
  await expect(input).toBeFocused();
  expect(await input.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
  await page.getByRole("button", { name: "Valider la démonstration" }).click();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.fill("Camille"); await page.getByRole("button", { name: "Valider la démonstration" }).click();
  await expect(page.getByRole("status").filter({hasText:"Formulaire de démonstration validé localement."})).toBeVisible();
  await page.getByRole("button",{name:"Fermer la notification"}).click();
  await page.getByRole("button", {name:"Ouvrir la fenêtre"}).click();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.keyboard.press("Tab"); await expect(page.getByRole("button",{name:"Fermer",exact:true})).toBeFocused();
  await page.keyboard.press("Escape"); await expect(page.getByRole("button",{name:"Ouvrir la fenêtre"})).toBeFocused();
  await page.getByRole("tab",{name:"Vue d’ensemble"}).focus(); await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab",{name:"Accessibilité"})).toBeFocused();
 });
}
test("assets officiels et comportement PWA sans mode hors ligne",async({page,context,request},info)=>{
 await page.goto("/");
 const sources=await page.locator("img").evaluateAll(images=>images.map(img=>img.getAttribute("src")||""));
 expect(sources.length).toBeGreaterThan(0);expect(sources.every(src=>src.includes("/branding/01_Logos_PNG/")&&src.endsWith(".png"))).toBe(true);
 const response=await request.get("/manifest.webmanifest");expect(response.ok()).toBe(true);const manifest=await response.json();
 expect(manifest.lang).toBe("fr-CA");expect(manifest.display).toBe("standalone");expect(manifest.start_url).toBe("/");
 for(const icon of manifest.icons){const image=await request.get(icon.src);expect(image.ok()).toBe(true);const data=await image.body();expect(data.subarray(1,4).toString()).toBe("PNG");expect(`${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`).toBe(icon.sizes);}
 const registrations=await page.evaluate(async()=>navigator.serviceWorker?(await navigator.serviceWorker.getRegistrations()).length:0);
 expect(registrations).toBe(0);
 await writeFile(info.outputPath("pwa.json"),JSON.stringify({manifest,registrations,offline:"non implémenté",installationReelle:"non testée"},null,2));
 await context.setOffline(true);let unavailable=false;try{const offline=await page.goto("/design-system?verification-hors-ligne=1",{timeout:15000});unavailable=!offline||!offline.ok();}catch{unavailable=true;}finally{await context.setOffline(false);}
 expect(unavailable).toBe(true);
});
