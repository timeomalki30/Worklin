-- ============================================================
-- WORKLIN — Schéma initial v1
-- Conformité réforme facturation électronique 2027
-- ============================================================
-- Ce fichier est IDEMPOTENT : il peut être rejoué autant de fois
-- que nécessaire sans erreur (drop complet puis recréation).
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- NETTOYAGE — supprime tout dans l'ordre inverse des dépendances
-- (permet de rejouer le script sans erreur sur une base existante)
-- ============================================================

-- 1. Politiques de stockage
drop policy if exists "avatars_auth_upload"  on storage.objects;
drop policy if exists "avatars_public_read"  on storage.objects;
drop policy if exists "photos_auth_upload"   on storage.objects;
drop policy if exists "photos_public_read"   on storage.objects;

-- 2. Politiques RLS sur les tables (ordre inverse de création)
drop policy if exists "avis_owner_delete"        on avis;
drop policy if exists "avis_public_insert"       on avis;
drop policy if exists "avis_public_read"         on avis;
drop policy if exists "demandes_owner_update"    on demandes;
drop policy if exists "demandes_owner_read"      on demandes;
drop policy if exists "demandes_public_insert"   on demandes;
drop policy if exists "agenda_client"            on agenda;
drop policy if exists "agenda_owner"             on agenda;
drop policy if exists "chantiers_owner"          on chantiers;
drop policy if exists "factures_owner"           on factures;
drop policy if exists "devis_owner"              on devis;
drop policy if exists "clients_owner"            on clients;
drop policy if exists "artisans_owner_all"       on artisans;
drop policy if exists "artisans_public_read"     on artisans;
drop policy if exists "profiles_self"            on profiles;

-- 3. Triggers
drop trigger if exists on_avis_insert        on avis;
drop trigger if exists on_auth_user_created  on auth.users;

-- 4. Fonctions
drop function if exists public.update_artisan_note() cascade;
drop function if exists public.handle_new_user()     cascade;

-- 5. Tables — ordre inverse de dépendance FK
drop table if exists waitlist  cascade;
drop table if exists avis      cascade;
drop table if exists demandes  cascade;
drop table if exists agenda    cascade;
drop table if exists chantiers cascade;
drop table if exists factures  cascade;
drop table if exists devis     cascade;
drop table if exists clients   cascade;
drop table if exists artisans  cascade;
drop table if exists profiles  cascade;

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ARTISANS
-- ============================================================
create table artisans (
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

create index artisans_slug_idx   on artisans(slug);
create index artisans_metier_idx on artisans(metier);
create index artisans_ville_idx  on artisans(ville);

-- ============================================================
-- CLIENTS (CRM artisan)
-- ============================================================
create table clients (
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

create index clients_artisan_idx on clients(artisan_id);

-- ============================================================
-- DEVIS
-- Numérotation séquentielle DEV-YYYY-NNNN (conformité 2027)
-- ============================================================
create table devis (
  id              uuid primary key default uuid_generate_v4(),
  artisan_id      uuid references artisans(id) on delete cascade,
  client_id       uuid references clients(id)  on delete set null,
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

create index devis_artisan_idx on devis(artisan_id);
create index devis_statut_idx  on devis(statut);

-- ============================================================
-- FACTURES
-- Numérotation séquentielle FAC-YYYY-NNNN (conformité 2027)
-- ============================================================
create table factures (
  id              uuid primary key default uuid_generate_v4(),
  artisan_id      uuid references artisans(id) on delete cascade,
  client_id       uuid references clients(id)  on delete set null,
  devis_id        uuid references devis(id)    on delete set null,
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

create index factures_artisan_idx on factures(artisan_id);
create index factures_statut_idx  on factures(statut);

-- ============================================================
-- CHANTIERS
-- ============================================================
create table chantiers (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade,
  client_id   uuid references clients(id)  on delete set null,
  titre       text not null,
  statut      text default 'planifie'
                check (statut in ('planifie','en_cours','suspendu','termine')),
  notes       text,
  photos      jsonb default '[]',
  date_debut  date,
  date_fin    date,
  created_at  timestamptz default now()
);

create index chantiers_artisan_idx on chantiers(artisan_id);

-- ============================================================
-- AGENDA
-- ============================================================
create table agenda (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade,
  client_id   uuid references clients(id)  on delete set null,
  titre       text,
  date        date not null,
  heure       time not null,
  duree       int default 60,
  type        text default 'rdv'       check (type   in ('rdv','chantier','autre')),
  statut      text default 'planifie'  check (statut in ('planifie','confirme','annule','termine')),
  notes       text,
  created_at  timestamptz default now()
);

create index agenda_artisan_date_idx on agenda(artisan_id, date);
create index agenda_client_idx       on agenda(client_id);

-- ============================================================
-- DEMANDES (depuis vitrine publique)
-- ============================================================
create table demandes (
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

create index demandes_artisan_idx on demandes(artisan_id, statut);

-- ============================================================
-- AVIS
-- ============================================================
create table avis (
  id          uuid primary key default uuid_generate_v4(),
  artisan_id  uuid references artisans(id) on delete cascade,
  client_nom  text not null,
  note        int  not null check (note between 1 and 5),
  commentaire text,
  source      text default 'dashboard',
  created_at  timestamptz default now()
);

create index avis_artisan_idx on avis(artisan_id);

-- Auto-update note_moyenne after avis insert/delete
create or replace function update_artisan_note()
returns trigger language plpgsql as $$
declare
  avg_note numeric;
  cnt      int;
begin
  -- Works for both INSERT and DELETE triggers
  select avg(note), count(*) into avg_note, cnt
  from avis
  where artisan_id = coalesce(new.artisan_id, old.artisan_id);

  update artisans
  set note_moyenne = round(avg_note, 2),
      nb_avis      = cnt
  where id = coalesce(new.artisan_id, old.artisan_id);

  return coalesce(new, old);
end;
$$;

create trigger on_avis_insert
  after insert or delete on avis
  for each row execute function update_artisan_note();

-- ============================================================
-- WAITLIST
-- ============================================================
create table waitlist (
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
  ('avatars',         'avatars',         true)
on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles   enable row level security;
alter table artisans   enable row level security;
alter table clients    enable row level security;
alter table devis      enable row level security;
alter table factures   enable row level security;
alter table chantiers  enable row level security;
alter table agenda     enable row level security;
alter table demandes   enable row level security;
alter table avis       enable row level security;

-- ── Profiles : accès uniquement à sa propre ligne ────────────
create policy "profiles_self"
  on profiles for all
  using (auth.uid() = id);

-- ── Artisans : lecture publique, écriture propriétaire ───────
create policy "artisans_public_read"
  on artisans for select
  using (actif = true);

create policy "artisans_owner_all"
  on artisans for all
  using (profile_id = auth.uid());

-- ── Clients : propriétaire uniquement ────────────────────────
create policy "clients_owner"
  on clients for all
  using (
    artisan_id in (
      select id from artisans where profile_id = auth.uid()
    )
  );

-- ── Devis : propriétaire uniquement ──────────────────────────
create policy "devis_owner"
  on devis for all
  using (
    artisan_id in (
      select id from artisans where profile_id = auth.uid()
    )
  );

-- ── Factures : propriétaire uniquement ───────────────────────
create policy "factures_owner"
  on factures for all
  using (
    artisan_id in (
      select id from artisans where profile_id = auth.uid()
    )
  );

-- ── Chantiers : propriétaire uniquement ──────────────────────
create policy "chantiers_owner"
  on chantiers for all
  using (
    artisan_id in (
      select id from artisans where profile_id = auth.uid()
    )
  );

-- ── Agenda : propriétaire ou client lié ──────────────────────
create policy "agenda_owner"
  on agenda for all
  using (
    artisan_id in (
      select id from artisans where profile_id = auth.uid()
    )
  );

create policy "agenda_client"
  on agenda for select
  using (
    client_id in (
      select c.id
      from clients c
      join artisans a on a.id = c.artisan_id
      where a.profile_id = auth.uid()
    )
  );

-- ── Demandes : insertion publique (vitrine), lecture propriétaire
create policy "demandes_public_insert"
  on demandes for insert
  with check (true);

create policy "demandes_owner_read"
  on demandes for select
  using (
    artisan_id in (
      select id from artisans where profile_id = auth.uid()
    )
  );

create policy "demandes_owner_update"
  on demandes for update
  using (
    artisan_id in (
      select id from artisans where profile_id = auth.uid()
    )
  );

-- ── Avis : lecture/insertion publique, suppression propriétaire
create policy "avis_public_read"
  on avis for select
  using (true);

create policy "avis_public_insert"
  on avis for insert
  with check (true);

create policy "avis_owner_delete"
  on avis for delete
  using (
    artisan_id in (
      select id from artisans where profile_id = auth.uid()
    )
  );

-- ── Storage : lecture publique, upload authentifié ────────────
create policy "photos_public_read"
  on storage.objects for select
  using (bucket_id = 'chantier-photos');

create policy "photos_auth_upload"
  on storage.objects for insert
  with check (bucket_id = 'chantier-photos' and auth.uid() is not null);

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_auth_upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);
