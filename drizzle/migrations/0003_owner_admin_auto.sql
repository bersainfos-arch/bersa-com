create or replace function public.grant_owner_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if exists (select 1 from auth.users u where u.id = new.id and lower(u.email) = 'dieudonnedjoma@gmail.com' and u.email_confirmed_at is not null) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
revoke execute on function public.grant_owner_admin() from public, anon, authenticated;
create trigger profiles_owner_admin after insert on public.profiles for each row execute function public.grant_owner_admin();