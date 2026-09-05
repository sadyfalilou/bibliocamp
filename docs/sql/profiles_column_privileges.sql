-- Audit RLS — cloisonnement des colonnes de `profiles`.
--
-- Constat : tout compte CONNECTE pouvait lire l'integralite de la table, y
-- compris des colonnes qui ne servent qu'aux routes serveur. La plus grave est
-- `newsletter_unsub_token` : ce jeton suffit a desabonner n'importe qui des
-- notifications de message et de l'infolettre, sans authentification.
--
-- La RLS est ROW-level : elle ne sait pas masquer des colonnes. Le cloisonnement
-- se fait donc au niveau des privileges de colonnes, que PostgREST applique.
-- Les routes serveur utilisent la service_role, qui n'est pas concernee.
--
-- Note PostgreSQL : on ne peut pas « revoquer une colonne » quand le SELECT est
-- accorde au niveau de la table. Il faut revoquer la table, puis accorder les
-- colonnes autorisees.
-- A executer dans le SQL Editor de Supabase.

-- ── Visiteur non connecte : aucun acces direct ──────────────────────────────
-- Les pages publiques (profil vendeur, fiche manuel) passent par des composants
-- serveur en service_role, jamais par la cle anonyme.
revoke select on public.profiles from anon;

-- ── Compte connecte : uniquement ce que l'interface affiche ─────────────────
-- Nom et avatar de l'interlocuteur dans la messagerie, du vendeur dans le
-- marketplace, du tuteur sur sa fiche — plus ses propres preferences.
revoke select on public.profiles from authenticated;

grant select (
  id,
  first_name,
  last_name,
  avatar_url,
  institution,
  campus,
  program,
  subjects,
  phone_verified,
  newsletter_opt_in,
  message_emails_opt_in,
  created_at
) on public.profiles to authenticated;

-- Colonnes volontairement NON accordees, reservees a la service_role :
--   newsletter_unsub_token  -> desabonnement de n'importe quel compte
--   is_admin                -> enumeration des administrateurs (hameconnage cible)
--   invite_code             -> detournement du parrainage
--   referred_by             -> graphe social des parrainages

-- ── Verification ────────────────────────────────────────────────────────────
-- select grantee, string_agg(column_name, ', ' order by column_name)
-- from information_schema.column_privileges
-- where table_name = 'profiles' and privilege_type = 'SELECT'
--   and grantee in ('anon', 'authenticated')
-- group by grantee;
-- → anon ne doit rien retourner ; authenticated ne doit lister que les 12 colonnes ci-dessus.
