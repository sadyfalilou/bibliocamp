-- Table pour le rate limiting persistant (check-phone API)
-- À exécuter dans l'éditeur SQL Supabase avant de déployer.

CREATE TABLE IF NOT EXISTS rate_limits (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  key        text        NOT NULL,  -- adresse IP
  created_at timestamptz DEFAULT now()
);

-- Index pour les requêtes de comptage par IP + fenêtre de temps
CREATE INDEX IF NOT EXISTS rate_limits_key_created_at
  ON rate_limits (key, created_at);

-- Nettoyage automatique des entrées de plus de 2h (évite que la table grossisse)
CREATE OR REPLACE FUNCTION delete_old_rate_limits()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM rate_limits WHERE created_at < now() - interval '2 hours';
$$;
