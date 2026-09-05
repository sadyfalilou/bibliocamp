-- Retablit la lecture de tous les profils par un compte connecte.
-- A garder sous la main pendant le test : si une page se vide, colle ceci.

drop policy if exists "profiles: soi-meme, publieurs et interlocuteurs" on profiles;

-- Retablit la politique d'origine a l'identique (nom compris).
create policy "Lire les profils"
  on profiles for select
  to authenticated
  using (true);
