-- Etape 1/2 — Sortir le jeton de desabonnement de `profiles`.
--
-- Constat d'audit (Burp) : tout compte CONNECTE lisait
-- profiles.newsletter_unsub_token. Ce jeton suffit a desabonner n'importe quel
-- utilisateur de ses notifications de message et de l'infolettre, par une
-- simple URL GET, sans authentification.
--
-- La RLS est row-level et les GRANT par colonne cassent les ecritures
-- PostgREST (RETURNING * interne). La seule approche viable est donc de
-- deplacer la colonne dans une table a laquelle le client n'accede jamais.
--
-- A executer AVANT de deployer le code. L'ancienne colonne reste en place
-- pendant la transition : le code en production continue de fonctionner.

create table if not exists profile_tokens (
  user_id     uuid primary key references profiles(id) on delete cascade,
  unsub_token uuid not null default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

-- Recherche par jeton lors du desabonnement
create unique index if not exists profile_tokens_unsub_token_idx
  on profile_tokens (unsub_token);

-- Reprise des jetons existants : les liens deja envoyes par courriel
-- doivent continuer de fonctionner.
insert into profile_tokens (user_id, unsub_token)
select id, newsletter_unsub_token from profiles
where newsletter_unsub_token is not null
on conflict (user_id) do nothing;

-- Aucune policy : seule la service_role, qui contourne la RLS, accede a cette
-- table. Aucun client n'y lit ni n'y ecrit, donc le probleme des ecritures
-- PostgREST ne se pose pas ici.
alter table profile_tokens enable row level security;
revoke all on public.profile_tokens from anon, authenticated;

-- Verification :
-- select count(*) from profile_tokens;  -- doit egaler le nombre de profils
