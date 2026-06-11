# Guide de déploiement — BiblioCamp

Ce document résume toute l'infrastructure mise en place pour BiblioCamp
et comment la gérer au quotidien.

---

## 1. Architecture

| Composant | Service | Détails |
|-----------|---------|---------|
| Frontend / Backend | Vercel (Hobby) | Déploiement automatique depuis GitHub |
| Base de données | Supabase (Free) | PostgreSQL + Auth + Storage |
| SMS / Vérification | Twilio Verify | Service SID : VA62f63ba392bdc3a69e258af56a8ddecb |
| Monitoring erreurs | Sentry | Captures automatiques en production |
| Domaine principal | bibliocamp.ca | Acheté sur GoDaddy |
| Domaine secondaire | bibliocamp.com | Redirige vers www.bibliocamp.ca |
| Email | ImprovMX (gratuit) | Redirige vers sadyfalilou1988@gmail.com |

---

## 2. URLs importantes

| Environnement | URL |
|---------------|-----|
| Production | https://www.bibliocamp.ca |
| Vercel (fallback) | https://bibliocamp.vercel.app |
| Local | http://localhost:3000 |
| Admin signalements | https://www.bibliocamp.ca/admin/reports |
| Admin invitations | https://www.bibliocamp.ca/admin/invitations |

---

## 3. Comptes et accès

| Service | URL de connexion |
|---------|-----------------|
| Vercel | https://vercel.com |
| Supabase | https://supabase.com/dashboard |
| Twilio | https://console.twilio.com |
| GoDaddy | https://godaddy.com |
| ImprovMX | https://improvmx.com |
| Sentry | https://sentry.io |
| GitHub | https://github.com/sadyfalilou/bibliocamp |

---

## 4. Variables d'environnement

Toutes les variables sont dans `.env.local` (jamais commité) et dans
**Vercel → Settings → Environment Variables**.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        ← server-side uniquement (routes API)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID=VA62f63ba392bdc3a69e258af56a8ddecb
ADMIN_EMAILS=sadyfalilou1988@gmail.com
NEXT_PUBLIC_SENTRY_DSN           (optionnel, pour le client)
SENTRY_DSN                       (optionnel, pour le serveur)
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais apparaître dans du code
> client (pages `app/*/page.js`). Il est uniquement dans les routes
> `app/api/*/route.js`.

Si tu ajoutes une nouvelle variable : l'ajouter dans Vercel ET dans
`.env.local` pour les tests locaux.

---

## 5. Routes publiques et protégées

### Routes accessibles sans authentification (`proxy.js`)

```
/login
/confidentialite
/cgu
/reset-password
/book/[isbn]       ← fiche manuel publique
/seller/[id]       ← profil vendeur public
/invite/[code]     ← page parrainage
/api/book
/api/seller
/api/listings (GET)
/api/invite
```

### Routes protégées (redirigent vers /login)

```
/app               ← marketplace
/create
/edit/[id]
/inbox
/profile
/admin/*
```

---

## 6. Workflow de développement

```bash
# Travailler sur une nouvelle fonctionnalité
git checkout develop
# ... faire les modifications ...
git add fichiers-modifies
git commit -m "description du changement"
git push origin develop

# Vérifier que tout passe
npm test

# Mettre en production
git checkout master
git merge develop --no-ff -m "Merge develop → master : description release"
git push origin master
# → Vercel déploie automatiquement en 1-2 minutes
```

Suivre le déploiement sur :
https://vercel.com → projet bibliocamp → Deployments

---

## 7. DNS GoDaddy — bibliocamp.ca

| Type | Nom | Valeur |
|------|-----|--------|
| A | @ | 216.198.79.1 |
| CNAME | www | f999fdeacbc22c4c.vercel-dns-O17.com. |
| MX | @ | mx1.improvmx.com (priorité 10) |
| MX | @ | mx2.improvmx.com (priorité 20) |
| TXT | @ | v=spf1 include:spf.improvmx.com ~all |

---

## 8. Emails

Gérés via **ImprovMX** — tout redirige vers `sadyfalilou1988@gmail.com` :

| Adresse | Usage |
|---------|-------|
| info@bibliocamp.ca | Contact général |
| confidentialite@bibliocamp.ca | Demandes Loi 25 / vie privée |
| *@bibliocamp.ca | Capture tout le reste |

---

## 9. Pages admin

### Signalements
URL : https://www.bibliocamp.ca/admin/reports

Permet de voir, ignorer ou supprimer les annonces signalées par les
utilisateurs.

### Invitations
URL : https://www.bibliocamp.ca/admin/invitations

Permet de voir les codes d'invitation et le nombre de filleuls par utilisateur.

Les deux pages sont accessibles uniquement avec le compte `ADMIN_EMAILS`.

Pour ajouter un autre admin : modifier la variable `ADMIN_EMAILS` dans
Vercel (séparer les adresses par des virgules).

---

## 10. Tests

```bash
# Tests unitaires (105 tests, 6 suites)
npm test

# Tests E2E Playwright — nécessite le serveur local (npm run dev)
npm run test:e2e

# Interface graphique Playwright
npm run test:e2e:ui
```

Voir `docs/TESTS.md` pour le détail complet des suites et règles de validation.

---

## 11. Backups

**Plan actuel (Free)** : pas de backup automatique Supabase.
Scripts manuels disponibles dans `scripts/` :
- `scripts/backup-db.ps1` (Windows PowerShell)
- `scripts/backup-db.sh` (Linux/Mac)

**Au passage sur Supabase Pro** : activer le PITR (Point-in-Time
Recovery) dans Supabase → Settings → Add-ons (~$100/mois).

---

## 12. Conformité Loi 25 (Québec)

Pages légales accessibles sans connexion :
- https://www.bibliocamp.ca/confidentialite
- https://www.bibliocamp.ca/cgu

Contact pour demandes de confidentialité : confidentialite@bibliocamp.ca
