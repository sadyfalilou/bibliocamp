-- Ajoute le suivi du forfait choisi et du paiement (manuel, hors Stripe)
-- a la table international_diagnostics. A executer une seule fois dans
-- le SQL Editor de Supabase.

alter table international_diagnostics add column if not exists forfait text;
alter table international_diagnostics add column if not exists prix numeric;
alter table international_diagnostics add column if not exists devise text not null default 'CAD';
alter table international_diagnostics add column if not exists payment_method text;

alter table international_diagnostics add column if not exists payment_status text not null default 'non_paye';
alter table international_diagnostics drop constraint if exists international_diagnostics_payment_status_check;
alter table international_diagnostics add constraint international_diagnostics_payment_status_check
  check (payment_status in ('non_paye', 'paye'));
