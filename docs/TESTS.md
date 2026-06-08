# Tests — BiblioCamp

Le projet a deux familles de tests automatisés. Voici comment les lancer
et les lire, sans aide extérieure.

## 1. Tests unitaires / API (Jest) — 62 tests

Vérifient la logique isolée : routes API, validation, rate limiting.

```powershell
npm test
```

Résultat attendu :
```
Test Suites: 3 passed, 3 total
Tests:       62 passed, 62 total
```

## 2. Tests E2E (Playwright) — 11 tests

Simulent un vrai utilisateur dans un navigateur : ouverture de pages,
remplissage de formulaires, clics, vérification de ce qui s'affiche.
Couvrent l'authentification, la navigation, la protection des routes
privées et les en-têtes de sécurité HTTP.

### Lancer en mode silencieux (rapide, résultat dans le terminal)

```powershell
cd C:\Users\Bibi\bibliocamp
npm run test:e2e
```

Résultat attendu (~2-3 minutes) :
```
Running 11 tests using 1 worker
...
11 passed (2.1m)
```

### Lancer avec l'interface graphique (recommandé pour observer/déboguer)

```powershell
npm run test:e2e:ui
```

Une fenêtre Playwright s'ouvre : liste des tests à gauche, navigateur
en direct à droite. Clique sur "Run all" pour tout lancer et regarder
chaque étape passer en vert ou en rouge.

## Lire un échec

Si un test échoue, le terminal affiche :
- ce qui était **attendu** (ex: voir tel texte ou telle URL)
- ce qui a été **trouvé** à la place
- un chemin vers une **trace** (`trace.zip`) à ouvrir avec :
  ```powershell
  npx playwright show-trace chemin\vers\trace.zip
  ```
  Ça rejoue l'échec étape par étape, comme une vidéo.

## Quand les lancer ?

- **Avant un déploiement important** : `npm test && npm run test:e2e`
- **Après une modification du système d'authentification ou des routes** :
  `npm run test:e2e` (ils couvrent justement ces zones sensibles)
- **Automatiquement** : le workflow GitHub Actions (`.github/workflows/ci.yml`)
  lance déjà `npm test` à chaque push — les tests E2E peuvent y être ajoutés
  plus tard si besoin (ils sont plus longs).

## Ajouter un nouveau test E2E

Crée un fichier dans `e2e/`, par exemple `e2e/ma-fonctionnalite.spec.js` :

```js
const { test, expect } = require('@playwright/test')

test('mon scénario', async ({ page }) => {
  await page.goto('/ma-page')
  await expect(page.getByText('Texte attendu')).toBeVisible()
})
```

Playwright le détecte automatiquement au prochain `npm run test:e2e`.
