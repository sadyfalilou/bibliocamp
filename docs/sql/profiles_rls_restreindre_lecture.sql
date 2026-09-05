-- Audit RLS — limiter l'enumeration de l'annuaire.
--
-- Constat : la politique SELECT de `profiles` autorise tout compte connecte a
-- lire TOUTES les lignes. N'importe qui cree un compte et aspire nom complet,
-- etablissement, programme et campus de tous les utilisateurs. Cela contredit
-- la minimisation appliquee sur les profils publics (nom reduit a l'initiale).
--
-- On remplace par : soi-meme, les gens qui PUBLIENT quelque chose (leur nom est
-- deja public par nature), et ses interlocuteurs en conversation.
--
-- IMPORTANT : `to authenticated` est essentiel. Sans cette clause, un visiteur
-- ANONYME satisferait les conditions EXISTS et lirait les profils des vendeurs
-- — une regression par rapport a aujourd'hui, ou l'anonyme n'obtient rien.

-- 1. Index de support : la politique est evaluee ligne par ligne.
create index if not exists listings_user_id_idx           on listings (user_id);
create index if not exists tutors_user_id_idx             on tutors (user_id);
create index if not exists roommate_listings_user_id_idx  on roommate_listings (user_id);
create index if not exists conversations_user1_idx        on conversations (user1_id);
create index if not exists conversations_user2_idx        on conversations (user2_id);

-- 2. Remplacement de la politique.
-- Nom verifie en production le 2026-09-05 : « Lire les profils », qual = true,
-- restreinte au role authenticated (l'anonyme obtient deja 0 ligne).
drop policy if exists "Lire les profils" on profiles;              -- nom reel en production
drop policy if exists "profiles: lecture publique" on profiles;   -- nom du depot (jamais applique)
drop policy if exists "profiles: lecture authentifiee" on profiles;
drop policy if exists "profiles: soi-meme, publieurs et interlocuteurs" on profiles;

create policy "profiles: soi-meme, publieurs et interlocuteurs"
  on profiles for select
  to authenticated
  using (
    auth.uid() = id
    or exists (select 1 from listings          l where l.user_id = profiles.id)
    or exists (select 1 from tutors            t where t.user_id = profiles.id)
    or exists (select 1 from roommate_listings r where r.user_id = profiles.id)
    or exists (
      select 1 from conversations c
      where (c.user1_id = auth.uid() and c.user2_id = profiles.id)
         or (c.user2_id = auth.uid() and c.user1_id = profiles.id)
    )
  );
