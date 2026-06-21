-- Avis/notation des vendeurs de manuels — meme principe que tutor_reviews
-- mais applique aux vendeurs (profiles). Un avis par paire (vendeur, auteur
-- de l'avis), modifiable/supprimable par son auteur, visible publiquement.
-- A executer dans le SQL Editor de Supabase.

create table if not exists seller_reviews (
  id bigint generated always as identity primary key,
  seller_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (seller_id, reviewer_id)
);

create index if not exists seller_reviews_seller_idx on seller_reviews(seller_id);

alter table seller_reviews enable row level security;

drop policy if exists "Lecture publique des avis" on seller_reviews;
create policy "Lecture publique des avis"
  on seller_reviews for select
  using (true);

drop policy if exists "Utilisateur connecte peut laisser un avis" on seller_reviews;
create policy "Utilisateur connecte peut laisser un avis"
  on seller_reviews for insert
  with check (auth.uid() = reviewer_id and auth.uid() <> seller_id);

drop policy if exists "Auteur peut modifier son avis" on seller_reviews;
create policy "Auteur peut modifier son avis"
  on seller_reviews for update
  using (auth.uid() = reviewer_id);

drop policy if exists "Auteur peut supprimer son avis" on seller_reviews;
create policy "Auteur peut supprimer son avis"
  on seller_reviews for delete
  using (auth.uid() = reviewer_id);
