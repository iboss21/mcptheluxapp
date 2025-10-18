-- Core multi-tenant schema
create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists sites (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references users(id),
  subdomain text unique not null,
  custom_domain text,
  created_at timestamptz default now()
);

create table if not exists pages (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  path text not null default '/',
  ast jsonb not null,
  updated_at timestamptz default now(),
  unique (site_id, path)
);

create table if not exists credits (
  user_id uuid references users(id) unique,
  allowance int not null default 250,
  used int not null default 0,
  period_start date not null default date_trunc('month', now())
);
