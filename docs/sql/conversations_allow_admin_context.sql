-- Autorise context_type='admin' sur conversations, pour les
-- conversations initiées par un admin (ex. avertissement à un
-- vendeur) depuis /admin/reports.
-- À exécuter dans le SQL Editor de Supabase.

alter table conversations drop constraint conversations_context_type_check;

alter table conversations
  add constraint conversations_context_type_check
  check (context_type in ('manuel', 'tuteur', 'admin'));
