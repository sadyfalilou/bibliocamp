# 📚 BiblioCamp

> La marketplace de manuels scolaires pour les étudiants canadiens.

## ✨ Fonctionnalités

- 🔐 Authentification email + réinitialisation mot de passe
- 📖 Annonces de manuels avec photo, ISBN, auteurs, état
- 🔍 Recherche et filtres (cours, institution, méthode)
- 💬 Messagerie temps réel entre acheteurs et vendeurs
- ❤️ Favoris et suivi de cours
- 👤 Profil utilisateur avec photo
- 📱 Vérification téléphone canadien (+1, anti-VoIP)
- 🔔 Notifications sonores et badge en temps réel

## 🛡️ Sécurité

- RLS Supabase sur toutes les tables
- Rate limiting (messages, annonces, API)
- Validation des champs client et serveur
- Blocage numéros VoIP via Twilio Lookup
- Variables d'environnement sécurisées

## 🛠️ Stack

| Technologie | Usage |
|---|---|
| Next.js 16 | Framework React (App Router) |
| Supabase | Base de données, Auth, Storage |
| Twilio | Vérification SMS |

## 🚀 Installation

```bash
git clone https://github.com/TON_USERNAME/bibliocamp.git
cd bibliocamp
npm install
cp .env.example .env.local
npm run dev
```

## ⚙️ Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

## 📁 Structure

```
app/
├── api/check-phone/  # Vérification Twilio
├── create/           # Publier un manuel
├── edit/[id]/        # Modifier
├── inbox/            # Messagerie
├── login/            # Auth
├── profile/          # Profil
├── reset-password/   # Reset mdp
└── page.js           # Dashboard
lib/supabase.js
proxy.js              # Middleware auth
```

## 🔄 Branches

- `master` — Production stable
- `develop` — Développement
- `feature/*` — Nouvelles fonctionnalités
- `fix/*` — Corrections

## 📋 Roadmap

- [ ] Déploiement Vercel
- [ ] Notation des vendeurs
- [ ] Recherche ISBN automatique (Google Books API)
- [ ] Notifications push mobile
