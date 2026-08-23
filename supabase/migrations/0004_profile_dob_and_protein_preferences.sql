alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists protein_enabled boolean not null default false,
  add column if not exists protein_goal text,
  add column if not exists protein_multiplier_override numeric;

alter table public.profiles
  drop constraint if exists profiles_protein_goal_check;

alter table public.profiles
  add constraint profiles_protein_goal_check
  check (
    protein_goal is null
    or protein_goal in ('stay_active','training_recovery','build_muscle','lose_fat_keep_muscle')
  );

alter table public.profiles
  drop constraint if exists profiles_protein_multiplier_override_check;

alter table public.profiles
  add constraint profiles_protein_multiplier_override_check
  check (
    protein_multiplier_override is null
    or (protein_multiplier_override >= 1.0 and protein_multiplier_override <= 2.0)
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, date_of_birth)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date
  );
  return new;
end;
$$;
