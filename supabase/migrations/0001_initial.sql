create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organisation_type text not null check (organisation_type in ('school','workplace','sports_club','gym','university','community','other')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'user' check (role in ('user','coach','organisation_admin')),
  created_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  category text not null,
  training_type text not null,
  measure_type text not null,
  unit text not null,
  default_target numeric,
  default_minutes integer,
  owner_user_id uuid references public.profiles(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete cascade,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id),
  activity_name text not null,
  activity_icon text,
  training_type text not null,
  amount numeric,
  unit text,
  duration_minutes numeric not null,
  credit_minutes numeric not null default 0,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_memberships enable row level security;
alter table public.activities enable row level security;
alter table public.activity_logs enable row level security;

create policy "profiles_read_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "activity_logs_read_own" on public.activity_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "activity_logs_insert_own" on public.activity_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "activity_logs_update_own" on public.activity_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "activity_logs_delete_own" on public.activity_logs for delete to authenticated using ((select auth.uid()) = user_id);

create policy "activities_read_system_or_own" on public.activities for select to authenticated using (is_system or owner_user_id = (select auth.uid()));
create policy "activities_insert_own" on public.activities for insert to authenticated with check (owner_user_id = (select auth.uid()) and is_system = false);
create policy "activities_update_own" on public.activities for update to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()) and is_system = false);
create policy "activities_delete_own" on public.activities for delete to authenticated using (owner_user_id = (select auth.uid()) and is_system = false);
