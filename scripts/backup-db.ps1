# Sauvegarde manuelle de la base Supabase (plan Free — pas de PITR/backups automatiques).
#
# Prérequis : pg_dump installé (https://www.postgresql.org/download/windows/)
# Récupère la chaîne de connexion dans Supabase → Project Settings → Database → Connection string (URI)
#
# Usage :
#   $env:DATABASE_URL = "postgresql://postgres.xxx:[PASSWORD]@[HOST]:5432/postgres"
#   .\scripts\backup-db.ps1

$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
    Write-Host "Erreur : la variable DATABASE_URL n'est pas définie." -ForegroundColor Red
    Write-Host 'Exemple : $env:DATABASE_URL = "postgresql://postgres.xxx:motdepasse@xxx.supabase.com:5432/postgres"'
    exit 1
}

if (-not (Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = "backups\bibliocamp-$timestamp.sql"

Write-Host "Sauvegarde en cours vers $file ..."
& pg_dump $env:DATABASE_URL --no-owner --no-acl -f $file

Write-Host "Compression ..."
& 7z a "$file.zip" $file | Out-Null
if (Test-Path "$file.zip") {
    Remove-Item $file
    Write-Host "Terminé : $file.zip" -ForegroundColor Green
} else {
    Write-Host "7-Zip introuvable — le fichier reste non compressé : $file" -ForegroundColor Yellow
}

Write-Host "Pense à copier ce fichier hors de cette machine (cloud, disque externe, etc.)" -ForegroundColor Cyan
