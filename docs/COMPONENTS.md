# Bibliothèque de composants

Responsable : Jonathan Kakesa. Les composants génériques ne dépendent pas des fonctionnalités métier.

| Export | Fichier | Comportement |
|---|---|---|
| Button | components/ui/primitives.tsx | Primary, secondary, ghost ; hover, focus, actif, disabled, loading |
| Field | components/ui/primitives.tsx | Label associé, aide, erreur, attributs natifs transmis |
| Card / Badge | components/ui/primitives.tsx | Surface et statut sémantiques |
| Alert | components/ui/primitives.tsx | Statut informatif ou alerte d’erreur |
| Progress / BarChart | components/ui/primitives.tsx | Valeur finie bornée 0–100, texte et graphique natif |
| Skeleton / EmptyState | components/ui/primitives.tsx | Statuts de chargement et absence de contenu |
| DataTable | components/ui/primitives.tsx | Caption, en-têtes et défilement horizontal |
| Dialog | components/ui/dialog.tsx | Radix : focus piégé, Échap, restitution du focus |
| Tabs | components/ui/tabs.tsx | Radix : sélection et navigation au clavier |
| Header | components/navigation/header.tsx | Navigation desktop/mobile et thème |
| Reveal | components/animations/reveal.tsx | Apparition ponctuelle, contenu SSR visible |

Exemple :

```tsx
<Button variant="secondary" loading={saving} onClick={save}>Enregistrer</Button>
<Field id="prenom" label="Prénom" required error={error} />
<Progress label="Progression" value={42} />
```

Les formulaires métier doivent définir leur propre validation serveur. Le formulaire du catalogue ne transmet rien. `Notification` (`components/ui/notification.tsx`) est une région `status` refermable ; aucune file globale de notifications n’est encore exposée. Le menu mobile utilise `details/summary`, pas un menu d’application ARIA. Les tableaux et graphiques sont des bases simples sans tri, pagination ou visualisation avancée.
