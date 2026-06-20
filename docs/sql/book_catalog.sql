-- Catalogue de manuels scolaires québécois, alimenté manuellement à
-- partir de sources comme la Coop UQAM et Chenelière Éducation.
-- Consulté en priorité par /api/isbn avant Google Books / Open Library,
-- car ces deux API généralistes ne couvrent pas bien les éditions
-- universitaires et collégiales québécoises.
-- À exécuter dans le SQL Editor de Supabase.

create table if not exists book_catalog (
  isbn text primary key,
  title text not null,
  authors text,
  publisher text,
  course_code text,
  cover_url text,
  source text not null default 'manual' check (source in ('coop_uqam', 'cheneliere', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists book_catalog_course_code_idx
  on book_catalog(course_code);

alter table book_catalog enable row level security;

-- Lecture publique — n'importe qui (même non connecté) peut chercher
-- un manuel par ISBN lors de la publication d'une annonce.
create policy "Lecture publique du catalogue"
  on book_catalog for select
  using (true);

-- Pas de policy INSERT/UPDATE pour les utilisateurs normaux :
-- l'alimentation se fait uniquement via la clé service role
-- (import manuel ou script d'import depuis les fichiers Coop/Chenelière).
