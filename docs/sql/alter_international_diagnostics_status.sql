-- Ajoute les statuts de suivi de consultation (consultation_planifiee, termine)
-- a la contrainte de la colonne status. A executer une seule fois dans le
-- SQL Editor de Supabase si la table international_diagnostics existe deja.

alter table international_diagnostics drop constraint if exists international_diagnostics_status_check;

alter table international_diagnostics add constraint international_diagnostics_status_check
  check (status in ('soumis', 'en_analyse', 'resultat_disponible', 'consultation_planifiee', 'termine'));
