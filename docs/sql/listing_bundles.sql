-- Annonce de lot : un etudiant vend plusieurs manuels ENSEMBLE, dans une seule
-- annonce, avec des photos de la pile de livres.
--
-- On enrichit `listings` plutot que de creer une table : la recherche, les
-- favoris, la messagerie (conversations.listing_id), les signalements, « Mes
-- annonces » et le profil vendeur continuent de fonctionner sans modification.
--
-- `bundle_items` est du texte (un titre par ligne) et non un tableau, pour
-- rester directement cherchable en ILIKE : un lot contenant « Comptabilite »
-- doit sortir quand on cherche ce mot.
-- A executer dans le SQL Editor de Supabase.

alter table listings add column if not exists is_bundle boolean not null default false;
alter table listings add column if not exists bundle_items text;
alter table listings add column if not exists image_urls text[];

-- Recherche plein texte simple sur les titres du lot
create index if not exists listings_bundle_items_idx
  on listings using gin (to_tsvector('french', coalesce(bundle_items, '')));
