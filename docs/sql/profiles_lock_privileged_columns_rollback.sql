-- Retire le verrouillage par declencheur.
drop trigger if exists profiles_lock_privileged_columns_update on profiles;
drop trigger if exists profiles_lock_privileged_columns_insert on profiles;
drop function if exists profiles_lock_privileged_columns();
drop function if exists profiles_force_privileged_defaults();
