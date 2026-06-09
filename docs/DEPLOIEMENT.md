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
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID=VA62f63ba392bdc3a69e258af56a8ddecb
ADMIN_EMAILS=sadyfalilou1988@gmail.com
NEXT_PUBLIC_SENTRY_DSN        (optionnel)
SENTRY_DSN                    (optionnel)
```

Si tu ajoutes une nouvelle variable : l'ajouter dans Vercel ET dans
`.env.local` pour les tests locaux.

---

## 5. Workflow de développement

```bash
# Travailler sur une nouvelle fonctionnalité
git checkout develop
# ... faire les modifications ...
git add .
git commit -m "description du changement"
git push origin develop

# Mettre en production
git checkout master
git merge develop
git push origin master
# → Vercel déploie automatiquement en 1-2 minutes
```

Tu peux suivre le déploiement sur :
https://vercel.com → projet bibliocamp → Deployments

---

## 6. DNS GoDaddy — bibliocamp.ca

| Type | Nom | Valeur |
|------|-----|--------|
| A | @ | 216.198.79.1 |
| CNAME | www | f999fdeacbc22c4c.vercel-dns-O17.com. |
| MX | @ | mx1.improvmx.com (priorité 10) |
| MX | @ | mx2.improvmx.com (priorité 20) |
| TXT | @ | v=spf1 include:spf.improvmx.com ~all |

---

## 7. Emails

Gérés via **ImprovMX** — tout redirige vers `sadyfalilou1988@gmail.com` :

| Adresse | Usage |
|---------|-------|
| info@bibliocamp.ca | Contact général |
| confidentialite@bibliocamp.ca | Demandes Loi 25 / vie privée |
| *@bibliocamp.ca | Capture tout le reste |

---

## 8. Page admin

URL : https://www.bibliocamp.ca/admin/reports

Accessible uniquement avec le compte `sadyfalilou1988@gmail.com`.
Permet de voir, ignorer ou supprimer les annonces signalées par les
utilisateurs (sans passer par Supabase).

Pour ajouter un autre admin : modifier la variable `ADMIN_EMAILS` dans
Vercel (séparer les adresses par des virgules).

---

## 9. Tests

```bash
# Tests unitaires (62 tests)
npm test

# Tests E2E Playwright (11 tests) — nécessite le serveur local
npm run test:e2e

# Interface graphique Playwright
npm run test:e2e:ui
```

Le CI/CD GitHub Actions lance `npm test` automatiquement à chaque push
sur `develop` ou `master`.

---

## 10. Backups

**Plan actuel (Free)** : pas de backup automatique Supabase.
Scripts manuels disponibles dans `scripts/` :
- `scripts/backup-db.ps1` (Windows PowerShell)
- `scripts/backup-db.sh` (Linux/Mac)

**Au passage sur Supabase Pro** : activer le PITR (Point-in-Time
Recovery) dans Supabase → Settings → Add-ons (~$100/mois).

---

## 11. Conformité Loi 25 (Québec)

Pages légales accessibles sans connexion :
- https://www.bibliocamp.ca/confidentialite
- https://www.bibliocamp.ca/cgu

Contact pour demandes de confidentialité : confidentialite@bibliocamp.ca
