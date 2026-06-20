-- Table de notification : informe un vendeur quand une de ses annonces
-- a été retirée OU qu'un avertissement a été émis par un administrateur
-- suite à un signalement.
-- À exécuter dans le SQL Editor de Supabase.

create table if not exists removed_listings_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_title text not null,
  reason text not null,
  type text not null default 'removed' check (type in ('removed', 'warning')),
  removed_at timestamptz not null default now(),
  read boolean not null default false
);

create index if not exists removed_listings_notices_user_id_idx
  on removed_listings_notices(user_id);

alter table removed_listings_notices enable row level security;

-- Le vendeur concerné peut voir ses propres notices
create policy "Lire ses propres notices"
  on removed_listings_notices for select
  using (auth.uid() = user_id);

-- Le vendeur concerné peut marquer ses notices comme lues
create policy "Marquer ses notices comme lues"
  on removed_listings_notices for update
  using (auth.uid() = user_id);

-- L'insertion se fait uniquement via la clé service role (route admin),
-- donc aucune policy INSERT pour les utilisateurs normaux.
