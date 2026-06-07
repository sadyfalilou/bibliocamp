#!/usr/bin/env bash
# Sauvegarde manuelle de la base Supabase (plan Free — pas de PITR/backups automatiques).
#
# Prérequis : psql / pg_dump installés (https://www.postgresql.org/download/)
# Récupère la chaîne de connexion dans Supabase → Project Settings → Database → Connection string (URI)
#
# Usage :
#   chmod +x scripts/backup-db.sh
#   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" ./scripts/backup-db.sh

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Erreur : la variable DATABASE_URL n'est pas définie."
  echo 'Exemple : DATABASE_URL="postgresql://postgres:xxx@xxx.supabase.co:5432/postgres" ./scripts/backup-db.sh'
  exit 1
fi

mkdir -p backups
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILE="backups/bibliocamp-$TIMESTAMP.sql"

echo "Sauvegarde en cours vers $FILE ..."
pg_dump "$DATABASE_URL" --no-owner --no-acl -f "$FILE"

echo "Compression ..."
gzip "$FILE"

echo "Terminé : $FILE.gz"
echo "Pense à copier ce fichier hors de cette machine (cloud, disque externe, etc.)"
