# Tests — BiblioCamp

Le projet a deux familles de tests automatisés. Voici comment les lancer
et les lire, sans aide extérieure.

---

## 1. Tests unitaires / API (Jest) — 105 tests, 6 suites

Vérifient la logique isolée : routes API, validation, rate limiting.

```powershell
npm test
```

Résultat attendu :
```
Test Suites: 6 passed, 6 total
Tests:       105 passed, 105 total
```

### Suites actuelles

| Fichier | Tests | Ce qui est couvert |
|---|---|---|
| `__tests__/validation.test.js` | 20 | Validation champs (isbn, prix, état, transaction, titre…) |
| `__tests__/api.listings.test.js` | 11 | POST/PATCH annonces : auth, ISBN requis, état requis, transaction requise |
| `__tests__/api.listings.status.test.js` | 7 | PATCH statut annonce : 401, 400, 404, 403, 200 |
| `__tests__/api.invite.test.js` | 6 | GET/POST parrainage : code, 404 parrain introuvable, 400 auto-parrainage |
| `__tests__/api.conversations.test.js` | 7 | POST conversation : auth, 400 auto-contact, conv existante, nouvelle conv |
| `__tests__/api.rate-limit.test.js` | 54 | Rate limiting sur toutes les routes sensibles |

### Règles de validation testées

- **ISBN** : obligatoire, 10 ou 13 chiffres
- **État du livre** : obligatoire, valeurs acceptées : `Neuf`, `Très bon état`, `Bon état`, `Acceptable`
- **Méthode de transaction** : au moins une parmi `meet_campus`, `meet_city`, `post`
- **Prix** : entre 1 $ et 9 999 $

---

## 2. Tests E2E (Playwright)

Simulent un vrai utilisateur dans un navigateur : ouverture de pages,
clics, vérification de ce qui s'affiche. Le serveur local doit tourner.

```powershell
# Lancer le serveur local dans un terminal séparé
npm run dev

# Puis dans un autre terminal
npm run test:e2e
```

### Suites E2E

| Fichier | Ce qui est couvert |
|---|---|
| `e2e/navigation.spec.js` | Pages publiques accessibles, routes privées redirigent vers /login, en-têtes HTTP |
| `e2e/public-pages.spec.js` | `/book/[isbn]`, `/seller/[id]`, `/invite/[code]` sans auth — breadcrumbs, boutons Se connecter/Rejoindre |
| `e2e/listing-form.spec.js` | Redirection vers /login sans auth, structure des tests avec auth (skip) |

### Mode interface graphique (recommandé pour déboguer)

```powershell
npm run test:e2e:ui
```

Une fenêtre Playwright s'ouvre : liste des tests à gauche, navigateur
en direct à droite. Clique sur "Run all" pour tout lancer.

---

## Lire un échec

Si un test unitaire échoue, le terminal affiche :
- ce qui était **attendu** (`Expected`)
- ce qui a été **reçu** (`Received`)
- le fichier et la ligne exacte

Si un test E2E échoue :
- un chemin vers une **trace** (`trace.zip`) s'affiche
- rejoue l'échec avec :
  ```powershell
  npx playwright show-trace chemin\vers\trace.zip
  ```

---

## Quand les lancer ?

| Situation | Commande |
|---|---|
| Avant tout merge vers master | `npm test && npm run test:e2e` |
| Après modification d'une route API | `npm test` |
| Après modification d'un middleware ou des routes publiques | `npm run test:e2e` |
| En développement continu | `npm run test:watch` |

---

## Ajouter un test unitaire

Crée un fichier dans `__tests__/`, par exemple `__tests__/api.nouvelleroute.test.js` :

```js
import { GET } from '../app/api/ma-route/route'

describe('GET /api/ma-route', () => {
  test('sans param → 400', async () => {
    const req = { url: 'http://localhost/api/ma-route' }
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
```

## Ajouter un test E2E

Crée un fichier dans `e2e/`, par exemple `e2e/ma-fonctionnalite.spec.js` :

```js
const { test, expect } = require('@playwright/test')

test('mon scénario', async ({ page }) => {
  await page.goto('/ma-page')
  await expect(page.getByText('Texte attendu')).toBeVisible()
})
```

Playwright le détecte automatiquement au prochain `npm run test:e2e`.
