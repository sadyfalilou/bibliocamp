-- ============================================================
-- BiblioCamp — Politiques RLS Supabase
--
-- ⚠️ ETAT REEL DE LA PRODUCTION, releve le 2026-09-05 via pg_policies.
-- Ce fichier a longtemps diverge de la base : il declarait des politiques sous
-- des noms qui n'ont jamais existe en production, et en omettait plusieurs.
-- Avant toute modification, reverifie :
--   select tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname='public' order by tablename, cmd;
--
-- Constats de l'audit de septembre 2026 non corriges a ce jour :
--   (profiles : is_admin/phone_verified — CORRIGE le 2026-09-05 par declencheur,
--    voir docs/sql/profiles_lock_privileged_columns.sql)
--   • seller_reviews : aucune verification d'interaction prealable, contrairement
--                 a tutor_reviews — n'importe qui peut noter n'importe quel vendeur
--   • messages  : un participant peut supprimer les messages de l'autre
--   • conversations : quatre politiques redondantes, la politique ALL suffit
--   • listings  : plafond RLS de 10 annonces/jour jamais atteint (toutes les
--                 publications passent par la service_role, qui ignore la RLS)
--   • roles     : plusieurs politiques ciblent {public} au lieu de
--                 {authenticated} ; sans danger (leurs conditions testent
--                 auth.uid(), NULL pour un anonyme) mais l'intention n'est pas
--                 declaree
-- ============================================================

-- ── Activer RLS sur toutes les tables ───────────────────────
ALTER TABLE listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits   ENABLE ROW LEVEL SECURITY;

-- ── listings ────────────────────────────────────────────────
-- Tout le monde peut lire les annonces actives
CREATE POLICY "listings: lecture publique"
  ON listings FOR SELECT
  USING (true);

-- Seul le propriétaire peut créer une annonce
CREATE POLICY "listings: création par le propriétaire"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seul le propriétaire peut modifier son annonce
CREATE POLICY "listings: modification par le propriétaire"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seul le propriétaire peut supprimer son annonce
CREATE POLICY "listings: suppression par le propriétaire"
  ON listings FOR DELETE
  USING (auth.uid() = user_id);

-- ── profiles ─────────────────────────────────────────────────
-- Lecture limitee a ce qu'un utilisateur a une raison de voir : lui-meme, les
-- comptes qui PUBLIENT quelque chose (leur nom est deja public), et ses
-- interlocuteurs. Avant l'audit de septembre 2026, cette politique etait
-- USING (true) : n'importe quel compte pouvait aspirer l'annuaire complet.
-- `TO authenticated` est essentiel — sans lui, un anonyme satisferait les
-- conditions EXISTS et lirait les profils de tous les vendeurs.
-- Voir docs/sql/profiles_rls_restreindre_lecture.sql
CREATE POLICY "profiles: soi-meme, publieurs et interlocuteurs"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM listings          l WHERE l.user_id = profiles.id)
    OR EXISTS (SELECT 1 FROM tutors            t WHERE t.user_id = profiles.id)
    OR EXISTS (SELECT 1 FROM roommate_listings r WHERE r.user_id = profiles.id)
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE (c.user1_id = auth.uid() AND c.user2_id = profiles.id)
         OR (c.user2_id = auth.uid() AND c.user1_id = profiles.id)
    )
  );

-- Chaque utilisateur gère uniquement son propre profil
CREATE POLICY "profiles: modification par le propriétaire"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: création par le propriétaire"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── conversations ─────────────────────────────────────────────
-- Seuls les participants peuvent voir une conversation
CREATE POLICY "conversations: accès participants"
  ON conversations FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Un participant crée la conversation
CREATE POLICY "conversations: création par un participant"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ── messages ─────────────────────────────────────────────────
-- Seuls les participants de la conversation peuvent lire les messages
CREATE POLICY "messages: lecture par les participants"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Un utilisateur ne peut envoyer que ses propres messages
CREATE POLICY "messages: envoi par l'auteur"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- ── wishlist ─────────────────────────────────────────────────
CREATE POLICY "wishlist: lecture personnelle"
  ON wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "wishlist: ajout personnel"
  ON wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlist: suppression personnelle"
  ON wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- ── reports ──────────────────────────────────────────────────
-- Un utilisateur connecté peut soumettre un signalement
CREATE POLICY "reports: création par utilisateur connecté"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Les signalements ne sont pas lisibles par les utilisateurs (admin seulement)
-- Aucune policy SELECT → accès bloqué par défaut

-- ── rate_limits ───────────────────────────────────────────────
-- Géré uniquement via la service role key (API routes)
-- Aucune policy → accessible seulement via service role (bypass RLS)
