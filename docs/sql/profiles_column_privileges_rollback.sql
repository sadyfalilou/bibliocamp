-- Retablit les privileges de lecture sur `profiles` (DEJA APPLIQUE en prod).
--
-- Conserve comme trace d'une tentative de cloisonnement qui NE MARCHE PAS, pour
-- qu'elle ne soit pas refaite : accorder SELECT colonne par colonne sur une
-- table ecrite via PostgREST casse toutes les ecritures.
--
-- Pourquoi : PostgREST construit ses ecritures avec un RETURNING * interne,
-- meme lorsque le client ne demande aucune representation en retour. Avec des
-- privileges accordes COLONNE PAR COLONNE, l'expansion de `*` echoue et
-- Postgres renvoie « permission denied for table profiles ». Consequence :
-- toute ecriture sur profiles (sauvegarde du profil, avatar, cours suivis,
-- creation du profil a l'inscription) est cassee.
--
-- Le privilege de table est donc retabli. Le cloisonnement des colonnes
-- sensibles devra passer par une table separee, pas par des GRANT de colonnes.

grant select on public.profiles to authenticated;
grant select on public.profiles to anon;

-- Verification : les ecritures doivent refonctionner immediatement.
-- select grantee, privilege_type from information_schema.table_privileges
-- where table_name = 'profiles' and grantee in ('anon','authenticated');
