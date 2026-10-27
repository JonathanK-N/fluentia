import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
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
  await expect(page.getByRole("heading", {name: "Mon abonnement"})).toBeVisible();
  await page.goto("/etudiant/comprehension-ecrite");
}

test("oral entraînement : média privé, lecteur, transcription et résultat", async ({page}, info) => {
  await student(page, info.project.name + "-oral");
  await page.goto("/etudiant/comprehension-orale");
  await page.getByRole("article").filter({has: page.getByRole("heading", {name: "Écoute de recette — annonce", exact: true})}).getByRole("button", {name: "Démarrer la série"}).click();
  await expect(page.getByRole("heading", {name: "Écoutez, choisissez, avancez."})).toBeVisible();
  // Le document se charge dès l’affichage de la question ; ▶ le lance.
  const audio = page.locator("audio");
  await expect(audio).toHaveAttribute("src", /\/audio\/$/);
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.readyState)).toBeGreaterThanOrEqual(1);
  await page.getByRole("button", {name: "Écouter le document", exact: true}).focus();
  await page.keyboard.press("Space");
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0);
  await page.getByText("Consulter la transcription", {exact: true}).click();
  await expect(page.getByText(/Signal synthétique de recette/)).toBeVisible();
  await page.getByRole("radio", {name: "Samedi à dix heures", exact: true}).check();
  await expect(page.getByRole("status")).toContainText("Réponse enregistrée");
  expect((await new AxeBuilder({page}).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({path: info.outputPath("oral-entrainement.png"), fullPage: true});
  await page.getByRole("button", {name: "Terminer la séance"}).click();
  await page.getByRole("button", {name: "Confirmer la soumission"}).click();
  await expect(page.getByText("1 réponse juste sur 1", {exact: true})).toBeVisible();
  await page.getByRole("link", {name: "Mes résultats", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Écoute", exact: true})).toBeVisible();
  await expect(page.getByText("1 / 1 réponses correctes · 100 %", {exact: true})).toBeVisible();
});

test("lecture complète : 39 questions, sauvegarde et correction sur PostgreSQL", async ({page}, info) => {
  await student(page, info.project.name + "-reading");
  await page.getByRole("article").filter({has: page.getByRole("heading", {name: "Lecture complète de recette — 39 questions", exact: true})}).getByRole("button", {name: "Démarrer la série"}).click();
  // Une question à la fois : on répond, puis « Suivant ».
  await expect(page.getByRole("radio")).toHaveCount(4);
  const map = page.getByRole("navigation", {name: "Vue d’ensemble"});
  for (let index = 1; index <= 39; index++) {
    await expect(page.getByRole("heading", {name: `Question ${index} / 39`, exact: true})).toBeVisible();
    await page.getByRole("radio", {name: "Samedi à dix heures", exact: true}).check();
    await expect(page.getByRole("status")).toContainText("Réponse enregistrée");
    // Correction en direct active par défaut : elle s’applique aussi en simulation.
    await expect(page.locator("label.student-choice[data-verdict=right]")).toHaveCount(1);
    if (index < 39) await page.getByRole("button", {name: "Suivant"}).click();
  }
  await expect(map.locator("button[data-state=answered]")).toHaveCount(39);
  await page.reload();
  await expect(map.locator("button[data-state=answered]")).toHaveCount(39);
  await page.getByRole("button", {name: "Terminer la séance"}).click();
  await page.getByRole("button", {name: "Confirmer la soumission"}).click();
  await expect(page.getByText("39 réponses justes sur 39", {exact: true})).toBeVisible();
  await expect(page.locator(".bilan-question")).toHaveCount(39);
  await expect(page.getByText("Afficher le texte")).toHaveCount(39);
  await page.screenshot({path: info.outputPath("lecture-complete-resultats.png"), fullPage: true});
  // Refaire la série : nouvelle tentative vierge sur la même version.
  await page.getByRole("button", {name: "Refaire la série"}).click();
  await expect(page.getByRole("heading", {name: "Question 1 / 39", exact: true})).toBeVisible();
  await expect(page.locator(".question-map button[data-state=answered]")).toHaveCount(0);
});

test("simulation orale : 39 questions ouvertes, navigation libre et réécoute", async ({page}, info) => {
  test.setTimeout(150_000);
  await student(page, info.project.name + "-simulation");
  await page.goto("/etudiant/comprehension-orale");
  await page.getByRole("article").filter({has: page.getByRole("heading", {name: "Écoute complète de recette — 39 questions", exact: true})}).getByRole("button", {name: "Démarrer la série"}).click();
  // Les 39 questions sont accessibles d’emblée, avec leurs choix.
  const map = page.getByRole("navigation", {name: "Vue d’ensemble"});
  await expect(map.locator(".question-map button:enabled")).toHaveCount(39);
  await expect(page.getByRole("radio")).toHaveCount(4);
  await map.getByRole("button", {name: /^Question 39,/}).click();
  await expect(page.getByRole("heading", {name: "Question 39 / 39", exact: true})).toBeVisible();
  await map.getByRole("button", {name: /^Question 1,/}).click();
  // Réécoute : le document se relance après sa fin.
  const audio = page.locator("audio");
  for (let round = 0; round < 2; round++) {
    await page.getByRole("button", {name: "Écouter le document", exact: true}).click();
    await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.ended), {timeout: 10_000}).toBe(true);
  }
  for (let index = 1; index <= 39; index++) {
    await expect(page.getByRole("heading", {name: `Question ${index} / 39`, exact: true})).toBeVisible();
    await page.getByRole("radio", {name: "Samedi à dix heures", exact: true}).check();
    await expect(page.getByRole("status")).toContainText("Réponse enregistrée");
    if (index < 39) await page.getByRole("button", {name: "Suivant"}).click();
  }
  await page.getByRole("button", {name: "Terminer la séance"}).click();
  await page.getByRole("button", {name: "Confirmer la soumission"}).click();
  await expect(page.getByText("39 réponses justes sur 39", {exact: true})).toBeVisible();
  await page.screenshot({path: info.outputPath("oral-complet-resultats.png"), fullPage: true});
});

test("interface éditoriale : création, demande de relecture et historique", async ({page}, info) => {
  await page.goto("/etudiant/compte");
  await page.getByLabel("Adresse e-mail", {exact: true}).fill("bank-editor@example.test");
  await page.getByLabel("Mot de passe", {exact: true}).fill("Edition!Fixture-7294");
  await page.getByRole("button", {name: "Se connecter", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Mon abonnement"})).toBeVisible();
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
  const wave = Buffer.alloc(8044);
  wave.write("RIFF", 0); wave.writeUInt32LE(8036, 4); wave.write("WAVE", 8); wave.write("fmt ", 12);
  wave.writeUInt32LE(16, 16); wave.writeUInt16LE(1, 20); wave.writeUInt16LE(1, 22);
  wave.writeUInt32LE(8000, 24); wave.writeUInt32LE(16000, 28); wave.writeUInt16LE(2, 32); wave.writeUInt16LE(16, 34);
  wave.write("data", 36); wave.writeUInt32LE(8000, 40);
  for (let index = 0; index < 4000; index++) wave.writeInt16LE(Math.round(1000 * Math.sin(2 * Math.PI * 440 * index / 8000)), 44 + index * 2);
  await page.getByLabel("Titre du média", {exact: true}).fill("Signal original de recette UI");
  await page.getByLabel("Document WAV", {exact: true}).setInputFiles({name: "fixture-ui.wav", mimeType: "audio/wav", buffer: wave});
  await page.getByLabel("Transcription", {exact: true}).fill("Signal de recette synthétique ; aucune parole pédagogique validée.");
  await page.getByLabel("Provenance du média et droits", {exact: true}).fill("Signal PCM créé dans le test automatisé, pas un contenu tiers.");
  await page.getByRole("button", {name: "Importer le média privé", exact: true}).click();
  await expect(page.getByRole("status")).toContainText("Média privé enregistré");
  await page.screenshot({path: info.outputPath("banque-editoriale.png"), fullPage: true});
});

async function staff(page: Page, email: string) {
  await page.goto("/etudiant/compte");
  await page.getByLabel("Adresse e-mail", {exact: true}).fill(email);
  await page.getByLabel("Mot de passe", {exact: true}).fill("Edition!Fixture-7294");
  await page.getByRole("button", {name: "Se connecter", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Mon abonnement"})).toBeVisible();
  await page.goto("/edition/import");
}

test("import Excel : série avec images, relecture par une autre personne, publication et zoom", async ({browser}, info) => {
  const editor = await (await browser.newContext()).newPage();
  await staff(editor, "bank-editor@example.test");
  expect((await new AxeBuilder({page: editor}).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  const zip = path.resolve("tests/fixtures/documents-en-image.zip");
  // Mauvaise épreuve choisie : refus clair, rien n’est importé.
  await editor.getByRole("group", {name: "Épreuve de la série"}).getByRole("button", {name: "Oral"}).click();
  await editor.locator(".import-drop input").setInputFiles(zip);
  await editor.getByRole("button", {name: "Importer la série Oral"}).click();
  await expect(editor.locator(".import-table")).toContainText("Ce fichier est un modèle Lecture, pas Oral.");
  await editor.getByRole("group", {name: "Épreuve de la série"}).getByRole("button", {name: "Lecture"}).click();
  await editor.locator(".import-drop input").setInputFiles(zip);
  await editor.getByRole("button", {name: "Importer la série Lecture"}).click();
  await expect(editor.locator(".import-success")).toContainText("importée : 2 questions en brouillon");
  const card = editor.locator(".import-series").first();
  await card.getByRole("button", {name: "Envoyer en relecture"}).click();
  await expect(card.locator(".import-status")).toHaveText("En relecture");

  const reviewer = await (await browser.newContext()).newPage();
  await staff(reviewer, "bank-reviewer@example.test");
  const pending = reviewer.locator(".import-series").first();
  await pending.getByLabel("Note de relecture").fill(`Lettre, article, choix et droits relus (${info.project.name}).`);
  await pending.getByRole("checkbox").check();
  await pending.getByRole("button", {name: "Approuver la série"}).click();
  await expect(pending.locator(".import-status")).toHaveText("Approuvée");
  await pending.getByRole("button", {name: "Publier la série"}).click();
  await expect(pending.locator(".import-status")).toContainText("Publiée");

  const learner = await (await browser.newContext()).newPage();
  await student(learner, info.project.name + "-image");
  await learner.getByRole("article").filter({has: learner.getByRole("heading", {name: "Documents en image — démonstration", exact: true})}).getByRole("button", {name: "Démarrer la série"}).click();
  await expect(learner.getByRole("heading", {name: "Question 1 / 2", exact: true})).toBeVisible();
  const image = learner.getByRole("img", {name: /Lettre de Julien Moreau/});
  await expect(image).toBeVisible();
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThanOrEqual(1200);
  await learner.getByRole("button", {name: "Agrandir le document"}).click();
  await expect(learner.getByRole("dialog", {name: "Document agrandi"})).toBeVisible();
  await learner.getByRole("button", {name: "Agrandir encore"}).click();
  await expect(learner.getByText("Zoom 150 %")).toBeVisible();
  await learner.keyboard.press("Escape");
  await expect(learner.getByRole("dialog", {name: "Document agrandi"})).toBeHidden();
  await learner.screenshot({path: info.outputPath("question-image.png"), fullPage: true});
});
