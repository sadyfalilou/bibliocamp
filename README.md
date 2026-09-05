# 📚 BiblioCamp

> La marketplace de manuels scolaires pour les étudiants canadiens.

## ✨ Fonctionnalités

- 🔐 Authentification email + réinitialisation mot de passe
- 📖 Annonces de manuels avec photo, ISBN, auteurs, état, méthode de transaction
- 📦 Annonce de lot (`/create/lot`) — plusieurs manuels vendus **ensemble** dans une seule annonce : liste des titres, jusqu'à 6 photos de la pile, un prix global ; les titres du lot sont cherchables
- 📚 Publication de plusieurs annonces (`/create/multiple`) — coller jusqu'à 20 ISBN, titres et couvertures récupérés automatiquement, réglages communs, succès partiel ligne par ligne
- 🔍 Recherche par titre, ISBN, auteur, code de cours — filtres campus/institution cliquables
- 💬 Messagerie temps réel — ouverture directe de la conversation depuis la fiche manuel
- 🗑️ Suppression de conversation (avec confirmation)
- 👤 Profil vendeur public `/seller/[id]` accessible sans compte
- 📘 Page manuel publique `/book/[isbn]` avec liste des vendeurs (accessible sans compte)
- 🏷️ Système de badges (6 types) affichés sur le profil et les annonces
- 🎁 Système de parrainage avec lien d'invitation unique
- 📱 Vérification téléphone canadien (+1, anti-VoIP via Twilio)
- 🔔 Notifications sonores et badge en temps réel
- 📧 Notification courriel à la réception d'un message — envoyée seulement si le destinataire n'a pas la conversation ouverte, au plus une par conversation et par quart d'heure, désactivable depuis le profil
- 🛡️ Page admin signalements + gestion invitations
- 🏠 Colocs — annonces de chambre/coloc (publication, recherche/filtres, panneau de détail, signalement)
- ⭐ Avis/notation des vendeurs de manuels (page vendeur publique)
- 📚 Catalogue maison de manuels (Coop UQAM, Chenelière) prioritaire avant les APIs externes
- 🔔 Alerte courriel "manuel disponible" — un étudiant laisse son courriel sur une fiche manuel sans vendeur, et reçoit un email (Resend) dès qu'une annonce correspondante est publiée
- 📊 Page admin stats — graphiques Chart.js (croissance hebdomadaire, top matières tuteurs, répartition des tarifs)
- 👨‍🏫 Tuteurs — création de profil (domaines, matières, tarif, disponibilités), recherche/filtres, contact, avis/notation, **profils publics** (`/tuteurs`, `/tuteurs/[id]`) pour la découverte/SEO
- 🌍 Module international (`/international`) — diagnostic en 7 étapes, suivi des demandes, estimation de forfait, réservation Calendly, gestion admin (`/admin/international`)
- 🧭 Menu profil unifié (`components/ProfileMenu.js`) — favoris, messages, mes annonces, profil — partagé entre `/profile`, `/inbox`, `/create`, `/edit/[id]`

## 🛡️ Sécurité

- RLS Supabase sur toutes les tables (SELECT/INSERT/UPDATE/DELETE), politiques limitées au propriétaire ; fichiers versionnés dans `schema/` (`rls-policies.sql`, `tutors-rls.sql`, `messages-rls.sql`)
- **Accès admin** via la colonne `profiles.is_admin` (source de vérité unique) — `ADMIN_EMAILS` ne sert plus qu'aux notifications courriel du module international
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur (routes API)
- Rate limiting non contournable par 1re IP (messages, envoi OTP, `check-phone`, alertes manuel `book-alerts`)
- Anti-injection PostgREST sur les recherches (`.or` nettoyé) et validation UUID des identifiants
- Échappement HTML des champs utilisateur interpolés dans les courriels (`escapeHtml` dans `lib/sendEmail.js`) — anti-injection de markup
- Destinataire des conversations dérivé côté serveur depuis l'annonce/le profil tuteur, jamais d'un paramètre client
- Envoi des messages via `POST /api/messages` — auteur dérivé du jeton, participation à la conversation vérifiée, contenu validé côté serveur (`validateMessage`)
- Minimisation de PII sur les profils publics (nom de famille réduit à l'initiale)
- Validation des champs côté client (`lib/validation.js`) et côté serveur (routes API)
- ISBN, état du livre et méthode de transaction obligatoires à la création
- Vérification du téléphone obligatoire (`phone_verified`) avant toute publication publique — annonce manuel, annonce coloc, profil tuteur — sinon `403`
- Blocage numéros VoIP via Twilio Lookup
- Variables d'environnement sécurisées (`.env.local` jamais commité)
- En-têtes HTTP de sécurité (`X-Frame-Options`, `X-Content-Type-Options`, CSP)

## 🛠️ Stack

| Technologie | Version | Usage |
|---|---|---|
| Next.js | 16.2.6 | Framework React (App Router) |
| Supabase | ^2.106.2 | Base de données, Auth, Storage |
| Twilio | — | Vérification SMS |
| Resend | — | Envoi des alertes courriel "manuel disponible" |
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
ADMIN_EMAILS=                 # notifications courriel (international) — l'ACCÈS admin passe par profiles.is_admin
RESEND_API_KEY=               # alertes manuel, infolettre, notification de message
RESEND_FROM_EMAIL=
CRON_SECRET=                  # autorise /api/cron/*
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
```

## 📁 Structure

```
app/
├── api/
│   ├── conversations/   # Créer/trouver une conversation (destinataire dérivé de l'annonce)
│   ├── messages/        # Envoi d'un message + notification courriel, marquage lu (`/read`)
│   ├── invite/          # Système de parrainage
│   ├── listings/        # CRUD annonces + changement statut + publication en lot (`/batch`)
│   ├── seller/          # Profil vendeur public (single)
│   ├── sellers/         # Profils vendeurs publics en lot (anti N+1)
│   ├── book/            # Infos manuel (Google Books)
│   ├── book-alerts/     # Alerte courriel "manuel disponible" (rate-limited)
│   ├── isbn/            # Recherche ISBN (catalogue maison → Google Books → Open Library)
│   ├── cover/           # Proxy image de couverture (allowlist de domaines)
│   ├── badges/          # Calcul et récupération badges
│   ├── stats/           # Statistiques (accueil public : annonces/tuteurs/colocs)
│   ├── roommates/       # CRUD annonces colocs + contact propriétaire
│   ├── tutors/          # Création profil tuteur + contact tuteur + badges
│   ├── send-otp/        # Envoi du code SMS (Twilio Verify, rate-limited)
│   ├── verify-otp/      # Vérification du code → phone_verified
│   ├── check-phone/     # Validation numéro + blocage VoIP (Twilio Lookup)
│   ├── newsletter/      # Désabonnement infolettre (token)
│   ├── cron/            # Tâches planifiées (newsletter de rentrée)
│   ├── delete-account/  # Suppression de compte + données (Loi 25)
│   ├── international-diagnostics/ # Diagnostic étudiant international (soumission, suivi)
│   └── admin/           # Rapports (manuels + colocs), invitations, stats, catalogue manuel, diagnostics international
├── app/                 # Dashboard / Marketplace (protégé) — manuels, tuteurs, colocs
├── international/       # Diagnostic, résultat, suivi des demandes (étudiants internationaux)
├── admin/roommate-reports/ # Signalements d'annonces colocs (admin)
├── book/[isbn]/         # Fiche manuel publique
├── seller/[id]/         # Profil vendeur public
├── invite/[code]/       # Page d'invitation parrainage
├── create/              # Publier un manuel (protégé)
├── create/lot/          # Vendre un lot de manuels — une annonce, N livres (protégé)
├── create/multiple/     # Créer N annonces distinctes d'un coup (protégé)
├── edit/[id]/           # Modifier une annonce (protégé)
├── inbox/               # Messagerie (protégé)
├── profile/             # Profil utilisateur (protégé)
├── login/               # Authentification
├── reset-password/      # Reset mot de passe
├── admin/               # Pages admin
├── cgu/                 # Conditions générales
└── confidentialite/     # Politique de confidentialité
components/              # Vues et composants partagés (accueil, colocs, tuteurs,
│                        # profils publics, menu profil, modale de vérif téléphone,
│                        # badges, FAQ…) + hooks (useTutorList, useTutorProfile)
│   └── admin/           # Graphiques Chart.js (StatsCharts)
lib/
├── validation.js        # Source unique de vérité pour la validation (client + routes API)
├── messageNotifications.js # Fenêtres et gabarit du courriel « nouveau message »
├── storage.js           # Upload d'images partagé (manuels, lots, colocs)
├── sendEmail.js         # Envoi Resend (unitaire + batch) + escapeHtml
├── tutorBadge.js        # Calcul des badges de réactivité tuteur
├── faqData.js           # Contenu des FAQ
└── supabase.js          # Client Supabase navigateur (clé anon)
proxy.js                 # Middleware Next.js — protection des routes
```

## 🔄 Branches

- `master` — Production stable
- `develop` — Développement actif
- `feature/*` — Nouvelles fonctionnalités
- `fix/*` — Corrections

## 🧪 Tests

```bash
# Tests unitaires (305 tests, 27 suites)
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
- [x] Notation des vendeurs et des tuteurs
- [x] Module tuteurs (profils publics, recherche, avis)
- [x] Module colocs (annonces, recherche, signalement)
- [x] Module international (diagnostic, suivi, gestion admin)
- [x] Alertes courriel "manuel disponible" + infolettre de rentrée
- [x] Notification courriel à la réception d'un message
- [ ] Notifications push mobile
- [x] Annonce de lot + publication de plusieurs annonces
- [ ] Offres / contre-offres de prix
