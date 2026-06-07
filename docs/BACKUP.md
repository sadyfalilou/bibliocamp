# Sauvegarde et restauration — BiblioCamp

## Contexte

Le projet utilise le **plan Free de Supabase**, qui ne fournit ni
*Point-in-Time Recovery* (PITR), ni backups automatiques gérés depuis le
dashboard. **La responsabilité de la sauvegarde nous incombe entièrement.**

> Si le projet gagne en traction, passer au plan Pro (~25 $/mois, backups
> quotidiens inclus) ou activer le PITR (+100 $/mois) devient une priorité.

## Que sauvegarder ?

1. **Base de données Postgres** — tables `listings`, `profiles`, `messages`,
   `conversations`, `reports`, `rate_limits`, etc.
2. **Fichiers Storage** — buckets `images` (photos d'annonces) et `avatars`
   (photos de profil).

## 1. Sauvegarder la base de données

### Manuellement (recommandé : 1 fois par semaine minimum)

```bash
# Récupère la chaîne de connexion :
# Supabase → Project Settings → Database → Connection string (URI, mode "Session")

DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" ./scripts/backup-db.sh
```

Le script génère un fichier compressé dans `backups/bibliocamp-AAAAMMJJ-HHMMSS.sql.gz`.

**Important : copie ensuite ce fichier hors de ta machine** (Google Drive,
disque externe, etc.) — un backup qui reste sur le même disque que la prod
ne protège de rien en cas de panne matérielle.

### Automatiser (optionnel)

Sur un serveur ou une tâche planifiée (cron / Tâche planifiée Windows), on
peut exécuter ce script chaque nuit et envoyer le résultat vers un stockage
distant (S3, Google Drive, etc.).

## 2. Sauvegarder les fichiers Storage

Le plan Free n'offre pas d'export en un clic. Solution simple : un script qui
liste les fichiers des buckets `images` et `avatars` via l'API Supabase
Storage et les télécharge localement. À mettre en place si le volume
d'annonces devient important — pour l'instant, les images sont régénérables
par les utilisateurs (re-upload), ce qui limite la criticité.

## 3. Restaurer une sauvegarde

```bash
gunzip backups/bibliocamp-20260101-020000.sql.gz
psql "$DATABASE_URL" -f backups/bibliocamp-20260101-020000.sql
```

⚠️ Restaurer écrase les données existantes. À faire uniquement sur un
projet Supabase vide ou de test, jamais directement sur la prod sans
confirmation et double sauvegarde préalable.

## Fréquence recommandée

| Phase du projet | Fréquence |
|---|---|
| Avant le lancement public | Avant chaque déploiement majeur |
| Après le lancement (faible trafic) | 1 fois par semaine |
| Croissance significative | Passer au plan Pro (backups quotidiens automatiques) |
