-- ============================================================
-- BiblioCamp — Corrections RLS ciblées pour tutors / tutor_reviews
-- À exécuter dans l'éditeur SQL Supabase, section par section.
--
-- Diagnostic préalable (étape 0) : les politiques existantes sont DÉJÀ
-- correctes pour l'essentiel (lecture publique, écritures limitées au
-- propriétaire, auto-avis bloqué). Ce script ne corrige que 3 points :
--   1. deux politiques UPDATE concurrentes sur tutors qui permettent à un
--      tuteur de s'auto-attribuer les badges is_verified / is_pro ;
--   2. (optionnel) exiger un contact préalable pour laisser un avis ;
--   3. empêcher les doublons d'avis.
--
-- ⚠️ Vérifie les noms de politiques via l'étape 0 avant de lancer, au cas
--    où ils diffèreraient de ceux ci-dessous.
-- ============================================================


-- ── CORRECTIF 1 — Une seule politique UPDATE sur tutors ──────────────────────
-- On supprime les DEUX politiques UPDATE existantes et on en crée une seule
-- qui : (a) limite au propriétaire, (b) interdit de modifier soi-même les
-- badges is_verified et is_pro (réservés aux admins, qui écrivent via la
-- service-role et contournent la RLS).

DROP POLICY IF EXISTS "tutors_update_own" ON tutors;
DROP POLICY IF EXISTS "tuteur modifie son profil" ON tutors;

CREATE POLICY "tutors: modification par le proprietaire (badges verrouilles)"
  ON tutors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_verified = (SELECT t.is_verified FROM tutors t WHERE t.id = tutors.id)
    AND is_pro      = (SELECT t.is_pro      FROM tutors t WHERE t.id = tutors.id)
  );


-- ── CORRECTIF 2 — Exiger un contact préalable pour un avis ───────────────────
-- L'INSERT actuel bloque déjà l'auto-avis. Ce remplacement ajoute la condition
-- « avoir déjà une conversation avec ce tuteur ». Le client (fiche tuteur +
-- panneau) n'affiche le bouton « Laisser un avis » que si une conversation
-- existe, pour éviter un refus RLS déroutant.

DROP POLICY IF EXISTS "user cree un avis" ON tutor_reviews;

CREATE POLICY "tutor_reviews: creation par un client ayant contacte le tuteur"
  ON tutor_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND reviewer_id <> (SELECT t.user_id FROM tutors t WHERE t.id = tutor_id)
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.tutor_id = tutor_reviews.tutor_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );


-- ── CORRECTIF 3 — Un seul avis par (tuteur, auteur) ─────────────────────────
-- Retire d'abord les doublons éventuels (garde le plus récent) :
DELETE FROM tutor_reviews a
USING tutor_reviews b
WHERE a.tutor_id = b.tutor_id
  AND a.reviewer_id = b.reviewer_id
  AND a.created_at < b.created_at;

-- Puis empêche tout futur doublon :
CREATE UNIQUE INDEX IF NOT EXISTS tutor_reviews_unique_reviewer
  ON tutor_reviews (tutor_id, reviewer_id);


-- ── Vérification finale ─────────────────────────────────────────────────────
-- Re-lance le diagnostic pour confirmer qu'il ne reste qu'UNE politique UPDATE
-- sur tutors et que l'INSERT de tutor_reviews porte bien la nouvelle condition :
-- select tablename, policyname, cmd, qual, with_check
-- from pg_policies where tablename in ('tutors','tutor_reviews') order by tablename, cmd;
