-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  prenom       text,
  nom          text,
  phone        text,
  avatar_url   text,
  role         text not null default 'client' check (role in ('client', 'artisan', 'admin')),
  created_at   timestamptz default now()
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
  metier          text not null,
  entreprise      text,
  siret           text,
  tva             text,
  adresse         text,
  ville           text,
  description     text,
  tarif_horaire   numeric(10,2),
  note_moyenne    numeric(3,2),
  nb_avis         integer default 0,
  certifications  jsonb default '{}',
  actif           boolean default true,
  created_at      timestamptz default now()
);

create index if not exists artisans_metier_idx on artisans(metier);
create index if not exists artisans_ville_idx on artisans(ville);

-- ============================================================
-- DISPONIBILITÉS
-- ============================================================
create table if not exists disponibilites (
  id           uuid primary key default uuid_generate_v4(),
  artisan_id   uuid references artisans(id) on delete cascade,
  date         date not null,
  heure_debut  time not null,
  heure_fin    time not null,
  disponible   boolean default true,
  created_at   timestamptz default now()
);

create index if not exists dispos_artisan_date_idx on disponibilites(artisan_id, date);

-- ============================================================
-- RESERVATIONS
-- ============================================================
create table if not exists reservations (
  id                  uuid primary key default uuid_generate_v4(),
  client_id           uuid references profiles(id) on delete set null,
  artisan_id          uuid references artisans(id) on delete cascade,
  date                date not null,
  heure               time not null,
  statut              text not null default 'en_attente' check (statut in ('en_attente','confirmee','annulee','terminee')),
  description_travaux text,
  created_at          timestamptz default now()
);

create index if not exists reservations_artisan_idx on reservations(artisan_id, date);
create index if not exists reservations_client_idx on reservations(client_id);

-- ============================================================
-- CLIENTS ARTISAN (CRM)
-- ============================================================
create table if not exists clients_artisan (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade,
  prenom      text,
  nom         text not null,
  email       text,
  phone       text,
  adresse     text,
  notes       text,
  created_at  timestamptz default now()
);

create index if not exists clients_artisan_idx on clients_artisan(artisan_id);

-- ============================================================
-- DEVIS
-- ============================================================
create table if not exists devis (
  id              uuid primary key default uuid_generate_v4(),
  artisan_id      uuid references artisans(id) on delete cascade,
  client_id       uuid references clients_artisan(id) on delete set null,
  numero          text not null,
  titre           text,
  notes           text,
  date_emission   date not null,
  date_validite   date,
  statut          text not null default 'brouillon' check (statut in ('brouillon','envoye','accepte','refuse','expire')),
  lignes          jsonb not null default '[]',
  total_ht        numeric(12,2) not null default 0,
  tva             numeric(12,2) not null default 0,
  total_ttc       numeric(12,2) not null default 0,
  created_at      timestamptz default now()
);

create index if not exists devis_artisan_idx on devis(artisan_id);

-- ============================================================
-- FACTURES
-- ============================================================
create table if not exists factures (
  id              uuid primary key default uuid_generate_v4(),
  artisan_id      uuid references artisans(id) on delete cascade,
  client_id       uuid references clients_artisan(id) on delete set null,
  devis_id        uuid references devis(id) on delete set null,
  numero          text not null,
  titre           text,
  notes           text,
  date_emission   date not null,
  date_echeance   date,
  statut          text not null default 'brouillon' check (statut in ('brouillon','envoyee','payee','en_retard','annulee')),
  lignes          jsonb not null default '[]',
  total_ht        numeric(12,2) not null default 0,
  tva             numeric(12,2) not null default 0,
  total_ttc       numeric(12,2) not null default 0,
  created_at      timestamptz default now()
);

create index if not exists factures_artisan_idx on factures(artisan_id);

-- ============================================================
-- AVIS
-- ============================================================
create table if not exists avis (
  id              uuid primary key default uuid_generate_v4(),
  artisan_id      uuid references artisans(id) on delete cascade,
  client_id       uuid references profiles(id) on delete set null,
  reservation_id  uuid references reservations(id) on delete set null,
  note            integer not null check (note between 1 and 5),
  commentaire     text,
  created_at      timestamptz default now()
);

create index if not exists avis_artisan_idx on avis(artisan_id);

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
-- ARTISAN PIONEERS
-- ============================================================
create table if not exists artisan_pioneers (
  id              uuid primary key default uuid_generate_v4(),
  prenom          text,
  nom             text,
  email           text unique not null,
  phone           text,
  metier          text not null,
  ville           text,
  siret           text,
  certifications  jsonb default '{}',
  created_at      timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table artisans enable row level security;
alter table disponibilites enable row level security;
alter table reservations enable row level security;
alter table clients_artisan enable row level security;
alter table devis enable row level security;
alter table factures enable row level security;
alter table avis enable row level security;

-- Profiles: each user sees their own
create policy "profiles_self" on profiles for all using (auth.uid() = id);

-- Artisans: public read, owner write
create policy "artisans_public_read" on artisans for select using (actif = true);
create policy "artisans_owner_all" on artisans for all using (profile_id = auth.uid());

-- Disponibilites: public read, artisan write
create policy "dispos_public_read" on disponibilites for select using (true);
create policy "dispos_artisan_write" on disponibilites for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Reservations: client or artisan
create policy "resa_client" on reservations for all using (client_id = auth.uid());
create policy "resa_artisan" on reservations for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Clients artisan: owner only
create policy "clients_owner" on clients_artisan for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Devis: owner only
create policy "devis_owner" on devis for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Factures: owner only
create policy "factures_owner" on factures for all
  using (artisan_id in (select id from artisans where profile_id = auth.uid()));

-- Avis: public read, client write
create policy "avis_public_read" on avis for select using (true);
create policy "avis_client_write" on avis for insert with check (client_id = auth.uid());
