-- Annonces de chambre/coloc — V1 "mode annonce" (quelqu'un publie une
-- chambre ou un logement disponible, comme pour les manuels).
-- À exécuter dans le SQL Editor de Supabase.

create table if not exists roommate_listings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  rent_price numeric not null,
  room_type text not null check (room_type in ('chambre_privee', 'chambre_partagee', 'appartement_complet')),
  campus text,
  city text,
  available_from date,
  num_spots smallint not null default 1,
  image_url text,
  status text not null default 'active' check (status in ('active', 'rented')),
  created_at timestamptz not null default now()
);

create index if not exists roommate_listings_status_idx on roommate_listings(status);
create index if not exists roommate_listings_user_id_idx on roommate_listings(user_id);

alter table roommate_listings enable row level security;

create policy "Lecture publique des annonces actives"
  on roommate_listings for select
  using (status = 'active' or auth.uid() = user_id);

create policy "Le proprietaire peut creer son annonce"
  on roommate_listings for insert
  with check (auth.uid() = user_id);

create policy "Le proprietaire peut modifier son annonce"
  on roommate_listings for update
  using (auth.uid() = user_id);

create policy "Le proprietaire peut supprimer son annonce"
  on roommate_listings for delete
  using (auth.uid() = user_id);

-- Permet de contacter le proprietaire via la messagerie existante,
-- comme pour les manuels et les tuteurs.
alter table conversations drop constraint conversations_context_type_check;

alter table conversations
  add constraint conversations_context_type_check
  check (context_type in ('manuel', 'tuteur', 'admin', 'colocation'));

alter table conversations
  add column if not exists roommate_listing_id bigint references roommate_listings(id) on delete set null;
