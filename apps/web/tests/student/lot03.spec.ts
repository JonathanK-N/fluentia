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
  await expect(page.getByRole("heading", {name: "Mon abonnement"})).toBeVisible();
  await page.goto("/etudiant/comprehension-ecrite");
}

test("oral entraînement : média privé, lecteur, transcription et résultat", async ({page}, info) => {
  await student(page, info.project.name + "-oral");
  await page.goto("/etudiant/comprehension-orale");
  await page.getByRole("article").filter({has: page.getByRole("heading", {name: "Écoute de recette — annonce", exact: true})}).getByRole("button", {name: "Démarrer la série"}).click();
  await expect(page.getByRole("heading", {name: "À vous d’écouter"})).toBeVisible();
  await page.getByRole("button", {name: "Charger le document audio"}).click();
  const audio = page.locator("audio");
  await expect(audio).toHaveAttribute("src", /^blob:/);
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.readyState)).toBeGreaterThanOrEqual(1);
  // Contrôle effectif du moteur audio, sans prétendre que le signal de test est une voix.
  // Le lecteur n'active la commande qu'au décodage effectif (canplay), après readyState 1.
  await expect(page.getByRole("button", {name: "Lire le document", exact: true})).toBeEnabled();
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
  await expect(page.getByText("1 / 1 réponses correctes", {exact: false})).toBeVisible();
  await page.getByRole("link", {name: "Mes résultats", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Écoute", exact: true})).toBeVisible();
  await expect(page.getByText("1 / 1 réponses correctes · 100 %", {exact: true})).toBeVisible();
});

test("lecture complète : 39 questions, sauvegarde et correction sur PostgreSQL", async ({page}, info) => {
  await student(page, info.project.name + "-reading");
  await page.getByRole("article").filter({has: page.getByRole("heading", {name: "Lecture complète de recette — 39 questions", exact: true})}).getByRole("button", {name: "Démarrer la série"}).click();
  await expect(page.getByRole("radio")).toHaveCount(156);
  for (let index = 0; index < 39; index++) {
    await page.getByRole("radio", {name: "Samedi à dix heures", exact: true}).nth(index).check();
    await expect(page.getByRole("status")).toContainText("Réponse enregistrée");
    await expect(page.getByRole("radio").nth(index * 4 + 1)).toBeEnabled();
  }
  // Correction en direct active par défaut : elle s’applique aussi en simulation.
  await expect(page.locator("label.student-choice[data-verdict=right]")).toHaveCount(39);
  await page.reload();
  await expect(page.locator("input[type=radio]:checked")).toHaveCount(39);
  await page.getByRole("button", {name: "Terminer et vérifier mes réponses"}).click();
  await page.getByRole("button", {name: "Confirmer la soumission"}).click();
  await expect(page.getByText("39 / 39 réponses correctes", {exact: false})).toBeVisible();
  await expect(page.getByRole("heading", {name: /^Question \d+$/})).toHaveCount(39);
  await page.screenshot({path: info.outputPath("lecture-complete-resultats.png"), fullPage: true});
});

test("simulation orale : 39 documents, progression séquentielle et absence de réécoute", async ({page}, info) => {
  test.setTimeout(150_000);
  await student(page, info.project.name + "-simulation");
  await page.goto("/etudiant/comprehension-orale");
  await page.getByRole("article").filter({has: page.getByRole("heading", {name: "Écoute complète de recette — 39 questions", exact: true})}).getByRole("button", {name: "Démarrer la série"}).click();
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
  await expect(page.getByText("39 / 39 réponses correctes", {exact: false})).toBeVisible();
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
