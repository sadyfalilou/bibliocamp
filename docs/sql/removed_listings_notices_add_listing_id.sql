-- Ajoute une référence à l'annonce concernée, pour pouvoir afficher
-- un avertissement directement sur la carte de l'annonce elle-même
-- (utile uniquement pour les avertissements : une annonce retirée
-- n'existe plus, donc cette colonne reste NULL pour le type 'removed').
-- À exécuter dans le SQL Editor de Supabase, après removed_listings_notices.sql.

alter table removed_listings_notices
  add column if not exists listing_id bigint references listings(id) on delete set null;
