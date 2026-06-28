# Tests — BiblioCamp

Le projet a deux familles de tests automatisés. Voici comment les lancer
et les lire, sans aide extérieure.

---

## 1. Tests unitaires / API (Jest) — 221 tests, 18 suites

Vérifient la logique isolée : routes API, validation, rate limiting.

```powershell
npm test
```

Résultat attendu :
```
Test Suites: 18 passed, 18 total
Tests:       221 passed, 221 total
```

### Suites actuelles

| Fichier | Tests | Ce qui est couvert |
|---|---|---|
| `__tests__/validation.test.js` | 60 | Validation champs (isbn, prix, état, transaction, titre…) |
| `__tests__/api.listings.test.js` | 20 | POST/PATCH annonces : auth, 403 téléphone non vérifié, ISBN requis, état requis, transaction requise, domaine d'études (valide/invalide) |
| `__tests__/api.listings.status.test.js` | 7 | PATCH statut annonce : 401, 400, 404, 403, 200 |
| `__tests__/api.invite.test.js` | 6 | GET/POST parrainage : code, 404 parrain introuvable, 400 auto-parrainage |
| `__tests__/api.conversations.test.js` | 8 | POST conversation (manuel) : auth, 400 auto-contact, 403 téléphone non vérifié, conv existante, nouvelle conv |
| `__tests__/api.check-phone.test.js` | 7 | Vérification SMS du numéro de téléphone |
| `__tests__/api.roommates.test.js` | 26 | GET liste/filtres, POST publication (403 téléphone non vérifié), PATCH statut (JSON) + édition complète (multipart, photos), DELETE — auth, validation, 403/500 |
| `__tests__/api.roommates.contact.test.js` | 8 | POST contact coloc : auth, 400 auto-contact, 403 téléphone non vérifié, conv existante (par `roommate_listing_id`), nouvelle conv |
| `__tests__/api.tutors.test.js` | 11 | POST création profil tuteur : auth, 403 téléphone non vérifié, 409 déjà tuteur, validation (domaines, matières, tarif, bio, mode de rencontre), 200, erreur 500 |
| `__tests__/api.tutors.contact.test.js` | 8 | POST contact tuteur : auth, 400 auto-contact, 403 téléphone non vérifié, conv existante (par `tutor_id`), nouvelle conv |
| `__tests__/api.seller.test.js` | 4 | GET profil vendeur : 400 sans id, 404 introuvable, calcul `avgRating`/`reviewCount` à partir de `seller_reviews` |
| `__tests__/api.book-alerts.test.js` | 4 | POST alerte manuel : courriel/ISBN invalides, upsert valide, erreur 500 |
| `__tests__/api.newsletter-unsubscribe.test.js` | 4 | GET désabonnement infolettre : token manquant/invalide/valide, erreur 500 |
| `__tests__/api.cron-newsletter.test.js` | 5 | Cron infolettre rentrée : secret invalide, hors date, déjà envoyée, envoi aux abonnés, aucun abonné |
| `__tests__/api.international-diagnostics.test.js` | 6 | POST diagnostic international : auth, infos incomplètes, niveau requis, consentement requis, soumission valide, erreur 500 |
| `__tests__/api.international-diagnostics.id.test.js` | 4 | GET diagnostic par id : auth, 404 introuvable, 403 si autre utilisateur, 200 si propriétaire |
| `__tests__/api.international-diagnostics-id.test.js` | 4 | PATCH/édition diagnostic par id : auth, validation, 200 |
| `__tests__/api.admin.international.test.js` | 4 | GET liste admin des diagnostics : 403 sans auth/non-admin, 200 avec liste, erreur 500 |

> Vérification de sécurité (`phone_verified`) : couverte à la fois pour la création d'annonces manuels (`listings`), la publication d'annonces coloc (`roommates`) et la création de profil tuteur (`tutors`) — un compte dont le numéro n'est pas vérifié reçoit un `403` sur les trois routes.

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

Si un serveur de dev tourne déjà sur un port différent de 3000 (ex. port
auto-attribué par l'outil de preview), pointe directement les tests
vers lui au lieu d'en relancer un — `playwright.config.js` désactive
son `webServer` interne dès que `BASE_URL` est défini :

```powershell
$env:BASE_URL = "http://localhost:3383"
npm run test:e2e
```

### Suites E2E

| Fichier | Ce qui est couvert |
|---|---|
| `e2e/navigation.spec.js` | `/` (accueil publique) et `/login`/CGU/Confidentialité accessibles sans auth, routes privées (`/create`, `/inbox`, `/profile`, `/app`, `/admin/roommate-reports`) redirigent vers /login, en-têtes HTTP |
| `e2e/public-pages.spec.js` | `/book/[isbn]`, `/seller/[id]`, `/invite/[code]` sans auth — breadcrumbs, boutons Se connecter/Rejoindre |
| `e2e/listing-form.spec.js` | Redirection vers /login sans auth, structure des tests avec auth (skip) |
| `e2e/auth.spec.js` | Formulaire de connexion, erreur sur identifiants invalides (affichée inline, pas via `window.alert`), inscription complète (signup → connexion auto → redirection `/app`) |
| `e2e/colocs.spec.js` | `/app?view=colocs` et `/admin/roommate-reports` redirigent vers /login sans auth ; structure des tests avec auth (skip) — liste annonces, validation formulaire, panneau de détail |

> Note : `/` n'exige plus d'authentification depuis la refonte de la
> page d'accueil publique — elle affiche un aperçu (manuels, tuteurs)
> et un panneau de connexion, mais ne redirige plus vers `/login`.

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
