# 📚 BiblioCamp

> La marketplace de manuels scolaires pour les étudiants canadiens.

## ✨ Fonctionnalités

- 🔐 Authentification email + réinitialisation mot de passe
- 📖 Annonces de manuels avec photo, ISBN, auteurs, état, méthode de transaction
- 🔍 Recherche par titre, ISBN, auteur, code de cours — filtres campus/institution cliquables
- 💬 Messagerie temps réel — ouverture directe de la conversation depuis la fiche manuel
- 🗑️ Suppression de conversation (avec confirmation)
- 👤 Profil vendeur public `/seller/[id]` accessible sans compte
- 📘 Page manuel publique `/book/[isbn]` avec liste des vendeurs (accessible sans compte)
- 🏷️ Système de badges (6 types) affichés sur le profil et les annonces
- 🎁 Système de parrainage avec lien d'invitation unique
- 📱 Vérification téléphone canadien (+1, anti-VoIP via Twilio)
- 🔔 Notifications sonores et badge en temps réel
- 🛡️ Page admin signalements + gestion invitations

## 🛡️ Sécurité

- RLS Supabase sur toutes les tables (SELECT, INSERT, UPDATE, DELETE)
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur (routes API)
- Rate limiting (messages, annonces, API)
- Validation des champs côté client (`lib/validation.js`) et côté serveur (routes API)
- ISBN, état du livre et méthode de transaction obligatoires à la création
- Blocage numéros VoIP via Twilio Lookup
- Variables d'environnement sécurisées (`.env.local` jamais commité)
- En-têtes HTTP de sécurité (`X-Frame-Options`, `X-Content-Type-Options`, CSP)

## 🛠️ Stack

| Technologie | Version | Usage |
|---|---|---|
| Next.js | 16.2.6 | Framework React (App Router) |
| Supabase | ^2.106.2 | Base de données, Auth, Storage |
| Twilio | — | Vérification SMS |
| Sentry | ^10.56.0 | Monitoring erreurs production |
| Playwright | ^1.60.0 | Tests E2E |
| Jest | ^30 | Tests unitaires |

## 🚀 Installation

```bash
git clone https://github.com/sadyfalilou/bibliocamp.git
cd bibliocamp
npm install
cp .env.example .env.local   # remplir les variables
npm run dev
```

## ⚙️ Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
ADMIN_EMAILS=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
```

## 📁 Structure

```
app/
├── api/
│   ├── conversations/   # Créer/trouver une conversation
│   ├── invite/          # Système de parrainage
│   ├── listings/        # CRUD annonces + changement statut
│   ├── seller/          # Profil vendeur public
│   ├── book/            # Infos manuel (Google Books)
│   ├── badges/          # Calcul et récupération badges
│   ├── stats/           # Statistiques utilisateur
│   └── admin/           # Rapports et invitations (admin)
├── app/                 # Dashboard / Marketplace (protégé)
├── book/[isbn]/         # Fiche manuel publique
├── seller/[id]/         # Profil vendeur public
├── invite/[code]/       # Page d'invitation parrainage
├── create/              # Publier un manuel (protégé)
├── edit/[id]/           # Modifier une annonce (protégé)
├── inbox/               # Messagerie (protégé)
├── profile/             # Profil utilisateur (protégé)
├── login/               # Authentification
├── reset-password/      # Reset mot de passe
├── admin/               # Pages admin
├── cgu/                 # Conditions générales
└── confidentialite/     # Politique de confidentialité
components/
├── BadgeList.js         # Affichage badges
└── Logo.js              # Logo BIBLIOCAMP
lib/
└── validation.js        # Source unique de vérité pour la validation
proxy.js                 # Middleware Next.js — protection des routes
```

## 🔄 Branches

- `master` — Production stable
- `develop` — Développement actif
- `feature/*` — Nouvelles fonctionnalités
- `fix/*` — Corrections

## 🧪 Tests

```bash
# Tests unitaires (105 tests, 6 suites)
npm test

# Tests E2E Playwright (serveur local requis)
npm run test:e2e

# Interface graphique Playwright
npm run test:e2e:ui
```

## 📋 Roadmap

- [x] Déploiement Vercel (bibliocamp.ca)
- [x] Recherche ISBN automatique (Google Books API)
- [x] Pages publiques vendeur et manuel (sans compte)
- [x] Système de parrainage
- [x] Badges utilisateur
- [ ] Notation des vendeurs
- [ ] Notifications push mobile
- [ ] Offres / contre-offres de prix
