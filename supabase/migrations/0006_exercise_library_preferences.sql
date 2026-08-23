create table if not exists public.exercise_favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.exercise_favourites enable row level security;

drop policy if exists "Users can read own exercise favourites" on public.exercise_favourites;
create policy "Users can read own exercise favourites"
on public.exercise_favourites for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own exercise favourites" on public.exercise_favourites;
create policy "Users can add own exercise favourites"
on public.exercise_favourites for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own exercise favourites" on public.exercise_favourites;
create policy "Users can remove own exercise favourites"
on public.exercise_favourites for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, delete on table public.exercise_favourites to authenticated;

create table if not exists public.exercise_equipment_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bodyweight boolean not null default true,
  dumbbell boolean not null default true,
  kettlebell boolean not null default false,
  homegym boolean not null default false,
  fullgym boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.exercise_equipment_preferences enable row level security;

drop policy if exists "Users can read own equipment preferences" on public.exercise_equipment_preferences;
create policy "Users can read own equipment preferences"
on public.exercise_equipment_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own equipment preferences" on public.exercise_equipment_preferences;
create policy "Users can add own equipment preferences"
on public.exercise_equipment_preferences for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own equipment preferences" on public.exercise_equipment_preferences;
create policy "Users can update own equipment preferences"
on public.exercise_equipment_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.exercise_equipment_preferences to authenticated;
