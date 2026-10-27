# Expérience Fluentia v2

Responsable : Jonathan Kakesa. Co-auteur et contributeur : Mamadou Barry.

## Intention

Un espace de préparation calme et complet, organisé comme un tableau de bord d’apprentissage : navigation latérale groupée (Général, Compréhension, Expression, Préparation), barre supérieure avec fil d’Ariane et thème, pages pleines pour chaque compétence. Les principes v3 sont conservés : aucune progression fictive, statut non officiel affiché, état vide utile, focus visible, Poppins et logos officiels.

## Direction visuelle « Ivoire & Sable »

| Rôle | Valeur | Contraste vérifié |
|---|---|---|
| Fond | `#FAF7F2` | — |
| Surface | `#FFFFFF` | — |
| Sable (teintes, cartes secondaires) | `#F3ECE1` | — |
| Texte | `#1E1A16` | 16,2:1 |
| Texte secondaire | `#6B6157` | ≥ 5,1:1 sur fond, surface et sable |
| Accent bronze | `#8A5A2B` | ≥ 5,0:1 |
| Action | `#0B1F3A` (texte blanc) | 16,5:1 |
| Bordure de contrôle | `#8C7F70` | ≥ 3,9:1 |

Fluentia utilise un **thème clair unique** : la préférence sombre du système n’est pas appliquée, pour garder partout l’identité crème, beige et blanc de l’accueil. Le bleu vif n’est plus utilisé pour la structure ni l’action ; le cyan reste réservé à l’indicateur vocal et à la démonstration Voice. Les icônes sont des SVG linéaires 24 px (`components/app-shell/icons.tsx`), jamais des émojis.

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
