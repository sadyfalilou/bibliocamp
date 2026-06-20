-- Signalements pour les annonces de colocs, sur le meme modele que la
-- table "reports" des annonces de manuels.
-- A executer dans le SQL Editor de Supabase.

create table if not exists roommate_reports (
  id bigint generated always as identity primary key,
  roommate_listing_id bigint not null references roommate_listings(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (roommate_listing_id, reporter_id)
);

create index if not exists roommate_reports_listing_idx on roommate_reports(roommate_listing_id);

alter table roommate_reports enable row level security;

-- N'importe quel utilisateur connecte peut signaler une annonce (une seule fois,
-- grace a la contrainte unique ci-dessus).
drop policy if exists "Utilisateur connecte peut signaler" on roommate_reports;
create policy "Utilisateur connecte peut signaler"
  on roommate_reports for insert
  with check (auth.uid() = reporter_id);

-- Le proprietaire de l'annonce peut voir qu'elle a ete signalee (sans
-- voir le motif ni l'identite du rapporteur cote client — le composant
-- ne fait qu'un count).
drop policy if exists "Proprietaire voit les signalements sur son annonce" on roommate_reports;
create policy "Proprietaire voit les signalements sur son annonce"
  on roommate_reports for select
  using (
    exists (
      select 1 from roommate_listings r
      where r.id = roommate_reports.roommate_listing_id
        and r.user_id = auth.uid()
    )
  );
