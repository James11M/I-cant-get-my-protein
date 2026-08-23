alter table public.organisations add column if not exists is_subscribed boolean not null default false;
alter table public.organisations add column if not exists school_mode text;
alter table public.organisations drop constraint if exists organisations_school_mode_check;
alter table public.organisations add constraint organisations_school_mode_check check (school_mode is null or school_mode in ('boarding','day','hybrid'));

create unique index if not exists organisations_school_name_unique on public.organisations (lower(name)) where organisation_type = 'school';

alter table public.profiles add column if not exists linked_school_id uuid references public.organisations(id) on delete set null;

create table if not exists public.school_calendar_entries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  entry_type text not null check (entry_type in ('term','half_term','exeat','inset')),
  name text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint school_calendar_dates_valid check (end_date >= start_date)
);

create unique index if not exists school_calendar_entry_unique on public.school_calendar_entries (organisation_id, entry_type, name, start_date, end_date);

alter table public.organisations enable row level security;
alter table public.school_calendar_entries enable row level security;

drop policy if exists "Authenticated users can view subscribed schools" on public.organisations;
create policy "Authenticated users can view subscribed schools"
on public.organisations for select to authenticated
using (organisation_type = 'school' and is_subscribed = true);

drop policy if exists "Authenticated users can view subscribed school calendars" on public.school_calendar_entries;
create policy "Authenticated users can view subscribed school calendars"
on public.school_calendar_entries for select to authenticated
using (exists (
  select 1 from public.organisations o
  where o.id = school_calendar_entries.organisation_id
    and o.organisation_type = 'school'
    and o.is_subscribed = true
));

grant select on table public.organisations to authenticated;
grant select on table public.school_calendar_entries to authenticated;

insert into public.organisations (name, organisation_type, is_subscribed, school_mode)
select 'Sherborne School', 'school', true, 'boarding'
where not exists (select 1 from public.organisations where lower(name) = lower('Sherborne School') and organisation_type = 'school');

insert into public.organisations (name, organisation_type, is_subscribed, school_mode)
select 'Marlborough College', 'school', true, 'boarding'
where not exists (select 1 from public.organisations where lower(name) = lower('Marlborough College') and organisation_type = 'school');

update public.organisations set is_subscribed = true, school_mode = 'boarding' where name in ('Sherborne School','Marlborough College') and organisation_type = 'school';

insert into public.school_calendar_entries (organisation_id, entry_type, name, start_date, end_date)
select o.id, v.entry_type, v.name, v.start_date::date, v.end_date::date
from public.organisations o
cross join (values
  ('term','Autumn Term 2026','2026-09-01','2026-12-18'),
  ('term','Spring Term 2027','2027-01-05','2027-03-26'),
  ('term','Summer Term 2027','2027-04-13','2027-07-03')
) as v(entry_type,name,start_date,end_date)
where o.name = 'Sherborne School'
on conflict do nothing;

insert into public.school_calendar_entries (organisation_id, entry_type, name, start_date, end_date)
select o.id, v.entry_type, v.name, v.start_date::date, v.end_date::date
from public.organisations o
cross join (values
  ('term','Michaelmas Term 2026','2026-09-08','2026-12-16'),
  ('exeat','Michaelmas Exeat 1','2026-10-02','2026-10-05'),
  ('half_term','Michaelmas Half Term','2026-10-23','2026-11-08'),
  ('exeat','Michaelmas Exeat 2','2026-11-27','2026-11-30'),
  ('term','Lent Term 2027','2027-01-12','2027-03-24'),
  ('exeat','Lent Exeat 1','2027-01-29','2027-01-31'),
  ('half_term','Lent Half Term','2027-02-12','2027-02-21'),
  ('exeat','Lent Exeat 2','2027-03-12','2027-03-14'),
  ('term','Summer Term 2027','2027-04-19','2027-07-02'),
  ('exeat','Summer Exeat','2027-05-01','2027-05-03'),
  ('half_term','Summer Half Term','2027-05-29','2027-06-06')
) as v(entry_type,name,start_date,end_date)
where o.name = 'Marlborough College'
on conflict do nothing;
