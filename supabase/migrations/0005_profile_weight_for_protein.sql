alter table public.profiles
  add column if not exists current_weight_kg numeric;

alter table public.profiles
  drop constraint if exists profiles_current_weight_kg_check;

alter table public.profiles
  add constraint profiles_current_weight_kg_check
  check (current_weight_kg is null or (current_weight_kg >= 20 and current_weight_kg <= 300));
