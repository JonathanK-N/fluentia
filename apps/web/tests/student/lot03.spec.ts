import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import AxeBuilder from "@axe-core/playwright";

async function student(page: Page, suffix: string) {
  const email = `lot03-${suffix}-${Date.now()}@example.test`;
  await page.goto("/etudiant/compte");
  await page.getByRole("button", {name: "Inscription", exact: true}).click();
  await page.getByLabel("Prénom ou nom d’usage").fill("Recette Lot 03");
  await page.getByLabel("Adresse e-mail", {exact: true}).fill(email);
  await page.getByLabel("Mot de passe", {exact: true}).fill("Lecture!Orbite-7294");
  await page.getByRole("button", {name: "Créer mon compte"}).click();
  await expect(page.getByRole("status")).toContainText("message de vérification");
  const script = `import pathlib,email,re,sys; messages=[email.message_from_bytes(p.read_bytes()) for p in pathlib.Path(sys.argv[1]).glob('*')]; m=next(m for m in messages if sys.argv[2] in m.get('To','')); print(re.search(r'http[^\\s]+',m.get_payload(decode=True).decode('utf-8')).group(0))`;
  const verification = execFileSync(process.env.E2E_PYTHON || "python", ["-c", script, process.env.DJANGO_EMAIL_FILE_PATH!, email], {encoding: "utf8"}).trim();
  await page.goto(verification);
  await page.getByRole("button", {name: "Vérifier mon adresse", exact: true}).click();
  await expect(page.getByRole("status")).toContainText("Adresse vérifiée");
  await page.getByRole("link", {name: "Aller à mon compte", exact: true}).click();
  await page.getByLabel("Adresse e-mail", {exact: true}).fill(email);
  await page.getByLabel("Mot de passe", {exact: true}).fill("Lecture!Orbite-7294");
  await page.getByRole("button", {name: "Se connecter", exact: true}).click();
  await page.getByRole("link", {name: "Choisir un exercice"}).click();
}

test("oral entraînement : média privé, lecteur, transcription et résultat", async ({page}, info) => {
  await student(page, info.project.name + "-oral");
  await page.getByRole("button", {name: "Compréhension orale", exact: true}).click();
  await page.getByRole("article").filter({has: page.getByRole("heading", {name: "Écoute de recette — annonce", exact: true})}).getByRole("button", {name: "Commencer cet exercice"}).click();
  await expect(page.getByRole("heading", {name: "À vous d’écouter"})).toBeVisible();
  await page.getByRole("button", {name: "Charger le document audio"}).click();
  const audio = page.locator("audio");
  await expect(audio).toHaveAttribute("src", /^blob:/);
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.readyState)).toBeGreaterThanOrEqual(1);
  // Contrôle effectif du moteur audio, sans prétendre que le signal de test est une voix.
  await page.getByRole("button", {name: "Lire le document", exact: true}).focus();
  await page.keyboard.press("Space");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0);
  await page.getByText("Consulter la transcription", {exact: true}).click();
  await expect(page.getByText(/Signal synthétique de recette/)).toBeVisible();
  await page.getByRole("radio", {name: "Samedi à dix heures", exact: true}).check();
  await expect(page.getByRole("status")).toContainText("Réponse enregistrée");
  expect((await new AxeBuilder({page}).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({path: info.outputPath("oral-entrainement.png"), fullPage: true});
  await page.getByRole("button", {name: "Terminer et vérifier mes réponses"}).click();
  await page.getByRole("button", {name: "Confirmer la soumission"}).click();
  await expect(page.getByText("1 / 1", {exact: true})).toBeVisible();
  await page.getByRole("link", {name: "Ma progression", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Compréhension orale", exact: true})).toBeVisible();
  await expect(page.getByText("1 / 1 réponses correctes · 100 %", {exact: true})).toBeVisible();
});

test("lecture complète : 39 questions, sauvegarde et correction sur PostgreSQL", async ({page}, info) => {
  await student(page, info.project.name + "-reading");
  await page.getByRole("article").filter({has: page.getByRole("heading", {name: "Lecture complète de recette — 39 questions", exact: true})}).getByRole("button", {name: "Commencer cet exercice"}).click();
  await expect(page.getByRole("radio")).toHaveCount(156);
  for (let index = 0; index < 39; index++) {
    await page.getByRole("radio", {name: "Samedi à dix heures", exact: true}).nth(index).check();
    await expect(page.getByRole("status")).toContainText("Réponse enregistrée");
    await expect(page.getByRole("radio").nth(index * 4 + 1)).toBeEnabled();
  }
  await page.reload();
  await expect(page.locator("input[type=radio]:checked")).toHaveCount(39);
  await page.getByRole("button", {name: "Terminer et vérifier mes réponses"}).click();
  await page.getByRole("button", {name: "Confirmer la soumission"}).click();
  await expect(page.getByText("39 / 39", {exact: true})).toBeVisible();
  await expect(page.getByRole("heading", {name: /^Question \d+$/})).toHaveCount(39);
  await page.screenshot({path: info.outputPath("lecture-complete-resultats.png"), fullPage: true});
});

test("simulation orale : 39 documents, progression séquentielle et absence de réécoute", async ({page}, info) => {
  test.setTimeout(150_000);
  await student(page, info.project.name + "-simulation");
  await page.getByRole("button", {name: "Compréhension orale", exact: true}).click();
  await page.getByRole("article").filter({has: page.getByRole("heading", {name: "Écoute complète de recette — 39 questions", exact: true})}).getByRole("button", {name: "Commencer cet exercice"}).click();
  for (let index = 1; index <= 39; index++) {
    // Les sections n'ont pas de nom ARIA artificiel : sélection par structure sémantique.
    const document = page.locator("section").filter({has: page.getByRole("heading", {name: `Document ${index}`, exact: true})});
    await document.getByRole("button", {name: "Charger le document audio"}).click();
    await document.getByRole("button", {name: "Écouter le document chargé"}).click();
    await expect.poll(() => document.locator("audio").evaluate((element: HTMLAudioElement) => element.ended), {timeout: 10_000}).toBe(true);
    await document.getByRole("radio", {name: "Samedi à dix heures", exact: true}).check();
    await expect(page.getByRole("status")).toContainText("Réponse enregistrée");
    await expect(document.getByRole("button", {name: "Charger le document audio"})).toHaveCount(0);
  }
  await page.getByRole("button", {name: "Terminer et vérifier mes réponses"}).click();
  await page.getByRole("button", {name: "Confirmer la soumission"}).click();
  await expect(page.getByText("39 / 39", {exact: true})).toBeVisible();
  await page.screenshot({path: info.outputPath("oral-complet-resultats.png"), fullPage: true});
});

test("interface éditoriale : création, demande de relecture et historique", async ({page}, info) => {
  await page.goto("/etudiant/compte");
  await page.getByLabel("Adresse e-mail", {exact: true}).fill("bank-editor@example.test");
  await page.getByLabel("Mot de passe", {exact: true}).fill("Edition!Fixture-7294");
  await page.getByRole("button", {name: "Se connecter", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Mon profil étudiant"})).toBeVisible();
  const response = await page.goto("/edition");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await expect(page.getByRole("heading", {name: "Créer une question originale"})).toBeVisible();
  await page.getByLabel("Question", {exact: true}).fill(`Question originale de recette ${info.project.name}`);
  await page.getByLabel("Texte de lecture", {exact: true}).fill("La réunion commence mardi à neuf heures.");
  for (let index = 1; index <= 4; index++) await page.getByLabel(`Choix ${index}`, {exact: true}).fill(["Mardi à neuf heures", "Lundi soir", "Samedi matin", "Vendredi midi"][index - 1]);
  await page.getByLabel("Explication", {exact: true}).fill("Le jour et l'heure sont annoncés explicitement.");
  await page.getByLabel("Provenance et autorisation", {exact: true}).fill("Fixture originale de recette, sans validation humaine réelle.");
  await page.getByRole("button", {name: "Enregistrer le brouillon"}).click();
  await expect(page.getByRole("status")).toContainText("Brouillon enregistré");
  await page.getByRole("button", {name: "Enregistrer la décision"}).click();
  await expect(page.getByRole("status")).toContainText("Transition enregistrée");
  await expect(page.getByRole("heading", {name: "Version 1 · review", exact: true})).toBeVisible();
  await page.screenshot({path: info.outputPath("banque-editoriale.png"), fullPage: true});
});
