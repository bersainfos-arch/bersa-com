create table public.profiles (
  id uuid primary key,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  domain text not null,
  price_usd numeric,
  file_path text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.books to authenticated;
grant all on public.books to service_role;
alter table public.books enable row level security;
create policy "books read" on public.books for select to authenticated using (true);
create policy "books admin insert" on public.books for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "books admin update" on public.books for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "books admin delete" on public.books for delete to authenticated using (public.has_role(auth.uid(), 'admin'));