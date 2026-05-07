-- ============================================================
-- WORKLIN — Schéma initial v1
-- Conformité réforme facturation électronique 2027
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  prenom      text,
  nom         text,
  phone       text,
  avatar_url  text,
  role        text not null default 'client' check (role in ('client','artisan','admin')),
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ARTISANS
-- ============================================================
create table if not exists artisans (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid references profiles(id) on delete cascade,
  slug            text unique not null,
  metier          text not null,
  entreprise      text,
  description     text,
  adresse         text,
  ville           text,
  siret           text,
  tva             text,
  tarif_horaire   numeric(10,2),
  note_moyenne    numeric(3,2),
  nb_avis         int default 0,
  certifications  jsonb default '{}',
  plan            text default 'free' check (plan in ('free','pro','business')),
  actif           boolean default true,
  photo_url       text,
  cover_url       text,
  created_at      timestamptz default now()
);

create index if not exists artisans_slug_idx on artisans(slug);
create index if not exists artisans_metier_idx on artisans(metier);
create index if not exists artisans_ville_idx on artisans(ville);

-- ============================================================
-- CLIENTS (CRM artisan)
-- ============================================================
create table if not exists clients (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade,
  prenom      text,
  nom         text not null,
  email       text,
  phone       text,
  adresse     text,
  type        text default 'particulier' check (type in ('particulier','pro')),
  notes       text,
  created_at  timestamptz default now()
);

create index if not exists clients_artisan_idx on clients(artisan_id);

-- ============================================================
-- DEVIS
-- Numérotation séquentielle DEV-YYYY-NNNN (conformité 2027)
-- ============================================================
create table if not exists devis (
  id              uuid primary key default uuid_generate_v4(),
  artisan_id      uuid references artisans(id) on delete cascade,
  client_id       uuid references clients(id) on delete set null,
  numero          text not null,
  titre           text,
  notes           text,
  statut          text not null default 'brouillon'
                    check (statut in ('brouillon','envoye','accepte','refuse','expire')),
  lignes          jsonb not null default '[]',
  total_ht        numeric(12,2) not null default 0,
  tva             numeric(12,2) not null default 0,
  total_ttc       numeric(12,2) not null default 0,
  date_emission   date not null default current_date,
  date_validite   date,
  created_at      timestamptz default now()
);

create index if not exists devis_artisan_idx on devis(artisan_id);
create index if not exists devis_statut_idx on devis(statut);

-- ============================================================
-- FACTURES
-- Numérotation séquentielle FAC-YYYY-NNNN (conformité 2027)
-- ============================================================
create table if not exists factures (
  id              uuid primary key default uuid_generate_v4(),
  artisan_id      uuid references artisans(id) on delete cascade,
  client_id       uuid references clients(id) on delete set null,
  devis_id        uuid references devis(id) on delete set null,
  numero          text not null,
  titre           text,
  notes           text,
  statut          text not null default 'brouillon'
                    check (statut in ('brouillon','envoyee','payee','en_retard','annulee')),
  lignes          jsonb not null default '[]',
  total_ht        numeric(12,2) not null default 0,
  tva             numeric(12,2) not null default 0,
  total_ttc       numeric(12,2) not null default 0,
  date_emission   date not null default current_date,
  date_echeance   date,
  created_at      timestamptz default now()
);

create index if not exists factures_artisan_idx on factures(artisan_id);
create index if not exists factures_statut_idx on factures(statut);

-- ============================================================
-- CHANTIERS
-- ============================================================
create table if not exists chantiers (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  titre       text not null,
  statut      text default 'planifie'
                check (statut in ('planifie','en_cours','suspendu','termine')),
  notes       text,
  photos      jsonb default '[]',
  date_debut  date,
  date_fin    date,
  created_at  timestamptz default now()
);

create index if not exists chantiers_artisan_idx on chantiers(artisan_id);

-- ============================================================
-- AGENDA
-- ============================================================
create table if not exists agenda (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  titre       text,
  date        date not null,
  heure       time not null,
  duree       int default 60,
  type        text default 'rdv' check (type in ('rdv','chantier','autre')),
  statut      text default 'planifie' check (statut in ('planifie','confirme','annule','termine')),
  notes       text,
  created_at  timestamptz default now()
);

create index if not exists agenda_artisan_date_idx on agenda(artisan_id, date);
create index if not exists agenda_client_idx on agenda(client_id);

-- ============================================================
-- DEMANDES (depuis vitrine publique)
-- ============================================================
create table if not exists demandes (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade,
  nom         text not null,
  email       text,
  phone       text,
  description text not null,
  statut      text default 'nouveau' check (statut in ('nouveau','en_cours','traite','refuse')),
  source      text default 'vitrine',
  created_at  timestamptz default now()
);

create index if not exists demandes_artisan_idx on demandes(artisan_id, statut);

-- ============================================================
-- AVIS
-- ============================================================
create table if not exists avis (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade,
  client_nom  text not null,
  note        int not null check (note between 1 and 5),
  commentaire text,
  source      text default 'dashboard',
  created_at  timestamptz default now()
);

create index if not exists avis_artisan_idx on avis(artisan_id);

-- Auto-update note_moyenne after avis insert
create or replace function update_artisan_note()
returns trigger language plpgsql as $$
declare
  avg_note numeric;
  cnt int;
begin
  select avg(note), count(*) into avg_note, cnt
  from avis where artisan_id = new.artisan_id;
  update artisans set note_moyenne = round(avg_note, 2), nb_avis = cnt
  where id = new.artisan_id;
  return new;
end;
$$;

drop trigger if exists on_avis_insert on avis;
create trigger on_avis_insert
  after insert on avis
  for each row execute function update_artisan_note();

-- ============================================================
-- WAITLIST
-- ============================================================
create table if not exists waitlist (
  id         uuid primary key default uuid_generate_v4(),
  email      text unique not null,
  prenom     text,
  created_at timestamptz default now()
);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('chantier-photos', 'chantier-photos', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles      enable row level security;
alter table artisans      enable row level security;
alter table clients       enable row level security;
alter table devis         enable row level security;
alter table factures      enable row level security;
alter table chantiers     enable row level security;
alter table agenda        enable row level security;
alter table demandes      enable row level security;
alter table avis          enable row level security;

-- Profiles: own row only
create policy "profiles_self" on profiles for all using (auth.uid() = id);

-- Artisans: public read, owner full
create policy "artisans_public_read" on artisans for select using (actif = true);
create policy "artisans_owner_all"   on artisans for all
  using (profile_id = auth.uid());

-- Clients: owner only
create policy "clients_owner" on clients for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Devis: owner only (artisan)
create policy "devis_owner" on devis for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Factures: owner only
create policy "factures_owner" on factures for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Chantiers: owner only
create policy "chantiers_owner" on chantiers for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Agenda: owner or linked client
create policy "agenda_owner" on agenda for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));
create policy "agenda_client" on agenda for select
  using (client_id in (select id from clients where artisan_id in (select id from artisans where profile_id = auth.uid())));

-- Demandes: public insert (vitrine), owner read
create policy "demandes_public_insert" on demandes for insert with check (true);
create policy "demandes_owner_read"    on demandes for select
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));
create policy "demandes_owner_update"  on demandes for update
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Avis: public read + insert, owner delete
create policy "avis_public_read"   on avis for select using (true);
create policy "avis_public_insert" on avis for insert with check (true);
create policy "avis_owner_delete"  on avis for delete
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Storage policies
create policy "photos_public_read" on storage.objects for select using (bucket_id = 'chantier-photos');
create policy "photos_auth_upload" on storage.objects for insert
  with check (bucket_id = 'chantier-photos' and auth.uid() is not null);
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_auth_upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);
