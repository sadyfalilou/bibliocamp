-- ============================================================
-- BiblioCamp — Politiques RLS Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase.
-- Vérifie que RLS est activé sur chaque table avant d'appliquer.
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
-- Les profils sont publics en lecture (pseudo, campus, etc.)
CREATE POLICY "profiles: lecture publique"
  ON profiles FOR SELECT
  USING (true);

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
