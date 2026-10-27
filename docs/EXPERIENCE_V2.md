# Expérience Fluentia v2

Responsable : Jonathan Kakesa. Co-auteur et contributeur : Mamadou Barry.

## Intention

Un espace de préparation calme et complet, organisé comme un tableau de bord d’apprentissage : navigation latérale groupée (Général, Compréhension, Expression, Préparation), barre supérieure avec fil d’Ariane et thème, pages pleines pour chaque compétence. Les principes v3 sont conservés : aucune progression fictive, statut non officiel affiché, état vide utile, focus visible, Poppins et logos officiels.

## Direction visuelle « Marine & Indigo »

| Rôle | Valeur | Contraste vérifié |
|---|---|---|
| Barre latérale | `#111733`, élément actif `#232B52` | texte `#C9CDE3` 11,2:1, intertitres `#8A91B4` 5,7:1 |
| Fond de contenu | `#EEF0F6` | — |
| Cartes | `#FFFFFF`, bordure `#E2E5EF` | — |
| Texte | `#0F1530` | 15,8:1 |
| Texte secondaire | `#5B6178` | ≥ 5,4:1 |
| Bandeau d’accueil | indigo `#3B33A6` | texte blanc 9,5:1 |
| Accent et liens | `#4338CA` | 6,9:1 |
| Action principale | `#0F1530` (texte blanc) | 17,9:1 |
| Pastilles | lavande `#EEEBFF` / `#4F46E5`, menthe `#E3F5F0` / `#0F766E` | 5,4:1 / 4,8:1 |
| Échéance | `#FFF1E0` / `#B45309` | 4,5:1 |

Thème clair unique. Navigation : **Mon espace** (Accueil, Mes résultats, Mon programme, Profil), **Les 4 épreuves** (Lecture, Écoute, Rédaction, Oral), **Jour J** (Simulations TCF, Centre d’aide). Chaque page affiche « Espace étudiant », son titre et le lien « Voir le site ». Les icônes sont des SVG linéaires 24 px (`components/app-shell/icons.tsx`), jamais des émojis.

## Données et honnêteté

- Compréhension écrite et orale, examens blancs, progression : API existante, uniquement les tentatives réelles du compte.
- Expression écrite : brouillons dans `localStorage` de l’appareil ; aucune note calculée.
- Expression orale : enregistrements `MediaRecorder` gardés en mémoire du navigateur, jamais envoyés au serveur.
- Plan d’étude : calcul local indicatif ; il ne mesure pas un niveau.
- Les sujets d’expression sont originaux ; aucun sujet officiel n’est reproduit. Le format renvoie au site de France Éducation international.

## Démarrage local

Depuis la racine, PowerShell :

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
$env:DJANGO_DEBUG="1"; $env:FLUENTIA_E2E="1"; $env:PYTHONIOENCODING="utf-8"
$env:DATABASE_URL="sqlite:///$((Get-Location).Path -replace '\','/')/.venv/local-e2e.sqlite3"
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python ..\..\scripts\seed-student-e2e.py
.\.venv\Scripts\python ..\..\scripts\seed-lot03-e2e.py
.\.venv\Scripts\python manage.py runserver 127.0.0.1:8000
```

Dans un second terminal : `cd apps/web`, `npm ci`, `npm run dev`, puis http://localhost:3000/etudiant. Compte éditorial de recette fictif : `bank-editor@example.test` / `Edition!Fixture-7294`. Si les conteneurs Docker du projet tournent déjà, ils occupent les ports 3000 et 8000 : arrêtez-les (`docker compose down`) ou utilisez la procédure Docker du README.

## Vérifications réalisées

Chromium : `npm run typecheck`, `npm run lint`, 12 tests unitaires, 21 tests e2e frontend et 5 parcours étudiants e2e sur API réelle (dont axe WCAG 2.1 AA, y compris avec une préférence système sombre). Firefox et WebKit restent à exécuter en CI. Le test d’écoute attend désormais l’activation effective du bouton de lecture (décodage `canplay`) avant d’appuyer sur Espace.

## Profil, Premium et réglages d’entraînement

- `Subscription` (app `accounts`) : date de fin du Premium. Un abonnement court jusqu’à sa date de fin, sans pause possible. Le Premium est attribué dans Django Admin ; le paiement en ligne n’est pas branché, « Renouveler » l’indique.
- API : `GET auth/profile/` expose `subscription` (`free`, `premium`, `expired`, jours restants) et `preferences` ; `PATCH auth/profile/` accepte `display_name`, `live_correction`, `answer_sound`, avec session et CSRF.
- Correction en direct : `PUT attempts/{id}/answers/` renvoie `correct` uniquement en **entraînement** et si le réglage est actif ; toujours `null` en simulation. Le signal sonore est généré dans le navigateur (Web Audio).
- Page Profil : identité et déconnexion, abonnement, réglages d’entraînement ; le renvoi du lien de vérification n’apparaît que pour une adresse non vérifiée.
- Tests : `accounts/test_premium.py` (7 cas, dont l’absence de verdict en simulation).
