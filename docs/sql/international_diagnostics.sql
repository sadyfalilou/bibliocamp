-- Diagnostic du projet d'etudes pour les etudiants internationaux (module
-- /international). Formulaire en 7 etapes ; aucun champ ne porte sur le
-- permis d'etudes/visa (volontairement absent, voir les disclaimers du
-- module). Acces uniquement via les routes API (cle service role),
-- RLS active sans policy = aucun acces direct cote client.
-- A executer dans le SQL Editor de Supabase.

create table if not exists international_diagnostics (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Etape 1 : informations personnelles
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  country text not null,
  preferred_language text not null,
  timezone text not null,

  -- Etape 2 : parcours scolaire
  last_diploma text,
  current_level text,
  diploma_country text,
  field_of_study text,
  academic_description text,

  -- Etape 3 : projet d'etudes
  target_level text not null,
  target_field text,
  target_cities text[] not null default '{}',
  target_session text,

  -- Etape 4 : langues
  french_level text,
  english_level text,

  -- Etape 5 : budget
  annual_budget numeric,
  budget_currency text not null default 'CAD',

  -- Etape 6 : besoins d'accompagnement (sans option immigration)
  needs text[] not null default '{}',

  -- Etape 7 : consentement
  consent_data_processing boolean not null default false,
  consent_terms boolean not null default false,
  consent_marketing boolean not null default false,

  status text not null default 'soumis' check (status in ('soumis', 'en_analyse', 'resultat_disponible', 'consultation_planifiee', 'termine')),
  created_at timestamptz not null default now()
);

create index if not exists international_diagnostics_user_id_idx on international_diagnostics(user_id);
create index if not exists international_diagnostics_status_idx on international_diagnostics(status);

alter table international_diagnostics enable row level security;
