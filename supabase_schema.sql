-- Ibn Aleppo Real Estate Platform — run in the Supabase SQL editor.
create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  floors int not null check (floors > 0)
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  unit_number text not null,
  floor int not null,
  area numeric(8,2) not null,
  direction text,
  land_cost numeric(14,2) not null default 0,
  construction_cost numeric(14,2) not null default 0,
  status text not null default 'available' check (status in ('available', 'reserved')),
  unique (building_id, unit_number)
);

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  unit_id uuid unique references units(id) on delete set null,
  onboarding_token uuid not null unique default gen_random_uuid(),
  contract_url text,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  building_id uuid references buildings(id) on delete set null, -- null = split across the whole project
  milestone text not null,
  amount numeric(14,2) not null check (amount > 0),
  image_url text,
  invoice_date date not null default current_date
);

create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  building_id uuid references buildings(id) on delete cascade,
  kind text not null check (kind in ('blueprint_2d', 'render_3d', 'progress')),
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists idx_buildings_project on buildings(project_id);
create index if not exists idx_units_building on units(building_id);
create index if not exists idx_invoices_project on invoices(project_id);
create index if not exists idx_photos_building on progress_photos(building_id);

-- Row Level Security -------------------------------------------------------
alter table projects enable row level security;
alter table buildings enable row level security;
alter table units enable row level security;
alter table subscribers enable row level security;
alter table invoices enable row level security;
alter table progress_photos enable row level security;

-- Public (anon) can read project data for transparency.
create policy "public read projects"  on projects        for select using (true);
create policy "public read buildings" on buildings       for select using (true);
create policy "public read units"     on units           for select using (true);
create policy "public read photos"    on progress_photos for select using (true);
create policy "public read invoices"  on invoices        for select using (true);

-- Only signed-in admins can write; subscribers (personal data) are admin-only.
create policy "admin all projects"    on projects        for all to authenticated using (true) with check (true);
create policy "admin all buildings"   on buildings       for all to authenticated using (true) with check (true);
create policy "admin all units"       on units           for all to authenticated using (true) with check (true);
create policy "admin all photos"      on progress_photos for all to authenticated using (true) with check (true);
create policy "admin all invoices"    on invoices        for all to authenticated using (true) with check (true);
create policy "admin all subscribers" on subscribers     for all to authenticated using (true) with check (true);

-- Storage bucket for blueprints, photos, invoices and contracts ---------------
insert into storage.buckets (id, name, public) values ('ibn-aleppo', 'ibn-aleppo', true)
on conflict (id) do nothing;

create policy "public read files" on storage.objects for select using (bucket_id = 'ibn-aleppo');
create policy "admin upload files" on storage.objects for insert to authenticated with check (bucket_id = 'ibn-aleppo');
