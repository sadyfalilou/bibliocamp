-- ============================================================
-- BiblioCamp — Correctif RLS pour la table messages
-- À exécuter dans l'éditeur SQL Supabase, section par section.
--
-- Diagnostic (pg_policies) : les politiques de `conversations` sont correctes
-- (tout est limité au participant). Sur `messages`, deux problèmes :
--   1. La politique INSERT "Rate limit messages" est SÉPARÉE, donc combinée
--      par OU avec les autres : elle autorise l'insertion dès que
--      count_recent_messages < 20, SANS vérifier sender_id ni la participation
--      → un utilisateur peut forger un message au nom d'autrui, dans n'importe
--      quelle conversation. On corrige en combinant tout par AND dans UNE seule
--      politique INSERT.
--   2. La politique UPDATE "Marquer comme lu" autorise un participant à modifier
--      n'importe quelle colonne (dont le CONTENU d'un message d'autrui). On la
--      restreint aux messages REÇUS et on verrouille le contenu.
--
-- ⚠️ Vérifie les noms exacts via le diagnostic avant de lancer.
-- ============================================================


-- ── CORRECTIF 1 — Une seule politique INSERT (propriété + participation + anti-spam)
DROP POLICY IF EXISTS "Rate limit messages" ON messages;
DROP POLICY IF EXISTS "Envoyer un message" ON messages;
DROP POLICY IF EXISTS "messages: envoi par l'auteur" ON messages;
-- Nom final aussi, pour que le script soit ré-exécutable sans erreur 42710.
DROP POLICY IF EXISTS "messages: envoi par l'auteur (participant + anti-spam)" ON messages;

CREATE POLICY "messages: envoi par l'auteur (participant + anti-spam)"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
    AND count_recent_messages(auth.uid()) < 20
  );


-- ── CORRECTIF 2 — UPDATE limité au marquage "lu" des messages REÇUS, contenu verrouillé
-- (le client ne fait que passer read=true sur les messages des autres).
DROP POLICY IF EXISTS "Marquer comme lu" ON messages;
DROP POLICY IF EXISTS "messages: marquer comme lu (destinataire, contenu verrouille)" ON messages;

CREATE POLICY "messages: marquer comme lu (destinataire, contenu verrouille)"
  ON messages FOR UPDATE
  USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    sender_id <> auth.uid()
    AND content = (SELECT m.content FROM messages m WHERE m.id = messages.id)
  );


-- ── CORRECTIF 3 — Dédoublonner les politiques SELECT (les deux sont identiques :
-- participant). On garde une seule.
DROP POLICY IF EXISTS "Voir ses messages" ON messages;
-- (On conserve "messages: lecture par les participants".)


-- ── CORRECTIF 4 — Plafond de longueur des messages (défense en profondeur ;
-- l'insert étant direct côté client, on borne aussi en base).
-- Ignore l'erreur "already exists" si tu relances.
ALTER TABLE messages
  ADD CONSTRAINT messages_content_maxlen CHECK (char_length(content) <= 1000);


-- ── Vérification finale ─────────────────────────────────────────────────────
-- select tablename, policyname, cmd, qual, with_check
-- from pg_policies where tablename in ('messages','conversations')
-- order by tablename, cmd;
-- → messages ne doit avoir qu'UNE politique INSERT et UNE politique UPDATE.
