alter table public.orders add column payment_method text;
alter table public.orders add column payment_ref text;
alter table public.orders add column paid boolean not null default false;
drop policy "insert own" on public.orders;
create policy "insert own" on public.orders for insert to authenticated with check (user_id = auth.uid() and status = 'en_attente' and paid = false);