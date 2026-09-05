-- Verrouille is_admin et phone_verified par DECLENCHEUR, et non par privileges.
--
-- Pourquoi pas les privileges de colonnes : PostgREST genere du SQL au-dela de
-- ce que le client envoie (RETURNING * en lecture, ON CONFLICT DO UPDATE SET
-- incluant `id` en ecriture). Chaque tentative a casse une ecriture legitime.
--
-- Pourquoi pas un WITH CHECK : relire `profiles` depuis une politique de
-- `profiles` provoque une recursion infinie (42P17).
--
-- Un declencheur n'a aucun de ces defauts : il ne refuse jamais une ecriture,
-- il RESTAURE simplement la valeur d'origine des deux colonnes protegees. Une
-- tentative d'elevation passe donc silencieusement… sans aucun effet.
--
-- Seuls les roles clients de PostgREST sont restreints : `anon` et
-- `authenticated`. La service_role (routes serveur, dont verify-otp) et
-- `postgres` (editeur SQL du tableau de bord) ecrivent normalement.

create or replace function profiles_lock_privileged_columns()
returns trigger
language plpgsql
-- SECURITY INVOKER (defaut) : indispensable. En SECURITY DEFINER, current_user
-- vaudrait le proprietaire de la fonction (postgres) et jamais 'service_role' :
-- verify-otp ne pourrait plus ecrire phone_verified.
set search_path = public
as $$
begin
  -- On restreint les DEUX roles clients de PostgREST, plutot que d'autoriser
  -- un seul role. Sinon `postgres` (editeur SQL du tableau de bord) et tout
  -- autre role d'administration se retrouvent bloques : c'est ce qui empechait
  -- de modifier is_admin depuis l'editeur.
  if current_user in ('anon', 'authenticated') then
    new.is_admin       := coalesce(old.is_admin, false);
    new.phone_verified := coalesce(old.phone_verified, false);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_privileged_columns_update on profiles;
create trigger profiles_lock_privileged_columns_update
  before update on profiles
  for each row execute function profiles_lock_privileged_columns();

-- A la creation, les deux colonnes partent toujours de false pour un client.
create or replace function profiles_force_privileged_defaults()
returns trigger
language plpgsql
-- SECURITY INVOKER (defaut) : indispensable. En SECURITY DEFINER, current_user
-- vaudrait le proprietaire de la fonction (postgres) et jamais 'service_role' :
-- verify-otp ne pourrait plus ecrire phone_verified.
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.is_admin       := false;
    new.phone_verified := false;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_privileged_columns_insert on profiles;
create trigger profiles_lock_privileged_columns_insert
  before insert on profiles
  for each row execute function profiles_force_privileged_defaults();

-- Verification, avec un jeton d'utilisateur normal :
--   PATCH /rest/v1/profiles?id=eq.<soi>  {"is_admin": true}
--   -> 200, mais is_admin reste false dans la reponse.
