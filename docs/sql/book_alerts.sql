-- Alertes "manuel disponible" : un etudiant laisse son courriel pour un ISBN
-- qui n'a aucune annonce active. Quand une annonce correspondante est publiee,
-- /api/listings (POST) notifie chaque alerte en attente puis la marque
-- notified=true. Acces uniquement via les routes API (cle service role),
-- RLS active sans policy = aucun acces direct cote client.
-- A executer dans le SQL Editor de Supabase.

create table if not exists book_alerts (
  id bigint generated always as identity primary key,
  email text not null,
  isbn text not null,
  title text,
  notified boolean not null default false,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email, isbn)
);

create index if not exists book_alerts_isbn_pending_idx on book_alerts(isbn) where notified = false;

alter table book_alerts enable row level security;
