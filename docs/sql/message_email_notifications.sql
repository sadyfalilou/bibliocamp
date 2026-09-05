-- Notification courriel a la reception d'un message.
--
-- 1. Preference d'envoi, distincte de l'infolettre : les courriels de message
--    sont transactionnels (opt-in par defaut), l'infolettre est du marketing
--    (opt-in explicite). Le jeton `newsletter_unsub_token` deja present sur
--    profiles sert aux deux liens de desabonnement (?type=messages).
-- 2. Horodatage de derniere lecture par participant : sert a NE PAS envoyer de
--    courriel a quelqu'un qui a la conversation ouverte sous les yeux.
-- A executer dans le SQL Editor de Supabase.

alter table profiles
  add column if not exists message_emails_opt_in boolean not null default true;

alter table conversations
  add column if not exists last_read_at_user1 timestamptz;
alter table conversations
  add column if not exists last_read_at_user2 timestamptz;
