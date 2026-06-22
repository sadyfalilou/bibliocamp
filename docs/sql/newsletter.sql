-- Infolettre BiblioCamp : consentement opt-in (LCAP/CASL) + jeton de
-- desabonnement a usage unique, et journal des campagnes pour eviter les
-- doublons d'envoi (le cron tourne tous les jours, ne doit declencher
-- qu'une fois par campagne/annee).
-- A executer dans le SQL Editor de Supabase.

alter table profiles add column if not exists newsletter_opt_in boolean not null default false;
alter table profiles add column if not exists newsletter_unsub_token uuid not null default gen_random_uuid();

create table if not exists newsletter_campaigns_log (
  id bigint generated always as identity primary key,
  campaign_key text not null,
  sent_at timestamptz not null default now(),
  recipients_count int not null default 0
);

create index if not exists newsletter_campaigns_log_key_idx on newsletter_campaigns_log(campaign_key, sent_at);
