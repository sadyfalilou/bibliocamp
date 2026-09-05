-- Etape 2/2 — Supprimer la colonne exposee.
--
-- A executer UNIQUEMENT une fois le code deployé et verifie : plus aucune
-- route ne lit profiles.newsletter_unsub_token.
--
-- Verifier d'abord que la reprise est complete :
--   select (select count(*) from profiles) as profils,
--          (select count(*) from profile_tokens) as jetons;
-- Les deux nombres doivent etre egaux avant de continuer.

alter table profiles drop column if exists newsletter_unsub_token;
