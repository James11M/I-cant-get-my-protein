create table public.activity_favourites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, activity_id)
);

alter table public.activity_favourites enable row level security;

grant select, insert, delete on table public.activity_favourites to authenticated;

create policy "activity_favourites_read_own" on public.activity_favourites
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "activity_favourites_insert_own" on public.activity_favourites
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "activity_favourites_delete_own" on public.activity_favourites
for delete to authenticated
using ((select auth.uid()) = user_id);

insert into public.activities (name, icon, category, training_type, measure_type, unit, default_target, default_minutes, is_system)
select * from (values
  ('PE Lesson','🏫','School / PE','Conditioning','time','min',30,45,true),
  ('Rugby','🏉','Sport','Sport','time','min',30,80,true),
  ('Football','⚽','Sport','Sport','time','min',30,60,true),
  ('Running','🏃','Cardio','Conditioning','distanceKm','km',2,20,true),
  ('Swimming','🏊','Cardio','Conditioning','distanceMeters','m',500,30,true),
  ('Tennis','🎾','Sport','Sport','time','min',30,45,true),
  ('Hockey','🏑','Sport','Sport','time','min',30,60,true),
  ('Cycling','🚴','Cardio','Conditioning','time','min',30,40,true),
  ('Basketball','🏀','Sport','Sport','time','min',30,45,true),
  ('Rowing','🚣','Cardio','Conditioning','time','min',20,20,true),
  ('Badminton','🏸','Sport','Sport','time','min',30,45,true),
  ('Cricket','🏏','Sport','Sport','time','min',45,60,true),
  ('Golf','⛳','Sport','Sport','holes','holes',9,120,true),
  ('Walk / Hike','🥾','Recovery','Recovery','time','min',45,45,true),
  ('Mobility / Stretching','🧘','Recovery','Recovery','time','min',20,20,true)
) as seed(name, icon, category, training_type, measure_type, unit, default_target, default_minutes, is_system)
where not exists (
  select 1 from public.activities a
  where a.is_system and a.name = seed.name
);
