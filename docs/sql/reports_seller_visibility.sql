-- Permet au vendeur de voir qu'une annonce qu'il possède a été
-- signalée (en attente de revue par un admin), sans révéler le motif
-- ni l'identité du rapporteur — juste le fait qu'un signalement existe.
-- À exécuter dans le SQL Editor de Supabase.

alter table reports enable row level security;

create policy "Vendeur voit les signalements en attente sur ses annonces"
  on reports for select
  using (
    exists (
      select 1 from listings l
      where l.id = reports.listing_id
        and l.user_id = auth.uid()
    )
  );
