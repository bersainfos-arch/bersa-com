create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null default 'redaction',
  item text not null,
  modality text,
  full_name text not null,
  phone text not null,
  email text,
  details text,
  attachment_link text,
  price_usd numeric,
  status text not null default 'en_attente',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "insert own" on public.orders for insert to authenticated with check (user_id = auth.uid() and status = 'en_attente');
create policy "read own or admin" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin'));