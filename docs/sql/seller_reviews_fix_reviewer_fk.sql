-- Correctif : reviewer_id referencait auth.users(id), ce qui empeche
-- PostgREST de resoudre l'embed "profiles(...)" utilise par /api/seller
-- pour afficher l'avatar/nom de l'auteur de l'avis. On le fait pointer
-- vers profiles(id) a la place (profiles.id = auth.users.id de toute facon).
-- A executer dans le SQL Editor de Supabase.

alter table seller_reviews
  drop constraint if exists seller_reviews_reviewer_id_fkey;

alter table seller_reviews
  add constraint seller_reviews_reviewer_id_fkey
  foreign key (reviewer_id) references profiles(id) on delete cascade;
