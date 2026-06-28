-- Ajoute un champ "domaine" (Sciences, Commerce, Génie, etc.) aux annonces de manuels,
-- pour permettre un filtre par domaine d'études dans la recherche.
-- À exécuter une seule fois dans le SQL Editor de Supabase.

alter table listings
  add column if not exists domain text;

create index if not exists listings_domain_idx
  on listings(domain);
