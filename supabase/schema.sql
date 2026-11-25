-- ============================================================
-- Olympia Muse — database setup.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste this whole file → Run.
-- It is safe to run again (it only creates what is missing / replaces functions and rules).
--
-- After you register your own account on the site, make it an admin with:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================

-- ---------- Profiles: one row per account (role, saved details, measurements) ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  email        text,
  role         text not null default 'client' check (role in ('client', 'admin')),
  full_name    text,
  phone        text,
  address      jsonb not null default '{}'::jsonb,   -- { street, city, zip, country }
  measurements jsonb not null default '{}'::jsonb,   -- { height, weight, bust, waist, hips, inseam, usualSize, notes }
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New sign-ups get a profile automatically
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- Customers may only change these columns (never their own role or email)
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone, address, measurements) on public.profiles to authenticated;

-- ---------- Products ----------
-- `data` holds everything shown on the site (names, texts, sizes, colours + photos, info panels);
-- the price is its own column so the server can calculate order totals.
create table if not exists public.products (
  id         text primary key check (id ~ '^[a-z0-9][a-z0-9-]*$'),
  data       jsonb not null default '{}'::jsonb,
  price      numeric(10,2) check (price is null or price >= 0),
  active     boolean not null default true,
  sort       integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "products: public read" on public.products;
create policy "products: public read" on public.products
  for select using (active or public.is_admin());
drop policy if exists "products: admin write" on public.products;
create policy "products: admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Favourites ----------
create table if not exists public.favorites (
  user_id    uuid not null references auth.users on delete cascade,
  product_id text not null references public.products on delete cascade on update cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.favorites enable row level security;

drop policy if exists "favorites: own" on public.favorites;
create policy "favorites: own" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Orders ----------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id           bigint generated always as identity primary key,
  order_number text not null unique,
  user_id      uuid references auth.users on delete set null,
  email        text,
  items        jsonb not null,            -- copy of what was bought, with the prices at the time
  total        numeric(10,2) not null,
  payment      text not null check (payment in ('iris', 'bank')),
  customer     jsonb not null,            -- name, phone, address, notes
  measurements jsonb not null default '{}'::jsonb,
  status       text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'cancelled')),
  notified_at  timestamptz,               -- when the admin email went out
  confirmed_at timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.orders enable row level security;
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

drop policy if exists "orders: read own or admin" on public.orders;
create policy "orders: read own or admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
-- No insert policy: orders are created only through place_order() below.

-- Places an order for the logged-in customer. Prices come from the products table, never from the browser.
create or replace function public.place_order(p_items jsonb, p_customer jsonb, p_payment text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_item    jsonb;
  v_prod    public.products;
  v_qty     integer;
  v_size    text;
  v_color   text;
  v_lines   jsonb := '[]'::jsonb;
  v_total   numeric(10,2) := 0;
  v_number  text;
  v_prof    public.profiles;
  v_cust    jsonb;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if p_payment not in ('iris', 'bank') then raise exception 'bad_payment'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'empty_basket'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'too_many_items'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_prod from public.products where id = v_item->>'id' and active;
    if not found or v_prod.price is null then raise exception 'unavailable:%', v_item->>'id'; end if;

    v_qty := (v_item->>'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'bad_qty'; end if;

    v_size := nullif(left(v_item->>'size', 20), '');
    if jsonb_array_length(coalesce(v_prod.data->'sizes', '[]'::jsonb)) > 0
       and (v_size is null or not (v_prod.data->'sizes' ? v_size)) then
      raise exception 'bad_size:%', v_prod.id;
    end if;

    v_color := nullif(left(v_item->>'color', 60), '');
    if v_color is not null and not exists (
      select 1 from jsonb_array_elements(coalesce(v_prod.data->'colors', '[]'::jsonb)) c where c->>'name' = v_color
    ) then
      raise exception 'bad_color:%', v_prod.id;
    end if;

    v_lines := v_lines || jsonb_build_object(
      'id', v_prod.id, 'name', v_prod.data->'name', 'size', v_size, 'color', v_color,
      'qty', v_qty, 'price', v_prod.price
    );
    v_total := v_total + v_prod.price * v_qty;
  end loop;

  -- keep only the expected customer fields, trimmed to sane lengths
  v_cust := jsonb_build_object(
    'name',    left(coalesce(p_customer->>'name', ''), 120),
    'email',   left(coalesce(p_customer->>'email', ''), 160),
    'phone',   left(coalesce(p_customer->>'phone', ''), 40),
    'street',  left(coalesce(p_customer->>'street', ''), 160),
    'city',    left(coalesce(p_customer->>'city', ''), 80),
    'zip',     left(coalesce(p_customer->>'zip', ''), 20),
    'country', left(coalesce(p_customer->>'country', ''), 60),
    'notes',   left(coalesce(p_customer->>'notes', ''), 1000)
  );
  if v_cust->>'name' = '' or v_cust->>'phone' = '' or v_cust->>'street' = '' then
    raise exception 'missing_details';
  end if;

  select * into v_prof from public.profiles where id = v_uid;
  v_number := 'OM-' || nextval('public.order_number_seq');

  insert into public.orders (order_number, user_id, email, items, total, payment, customer, measurements)
  values (v_number, v_uid, coalesce(nullif(v_cust->>'email', ''), v_prof.email), v_lines, v_total, p_payment, v_cust,
          coalesce(v_prof.measurements, '{}'::jsonb));

  -- remember the details for next time
  update public.profiles set
    full_name = v_cust->>'name',
    phone     = v_cust->>'phone',
    address   = jsonb_build_object('street', v_cust->>'street', 'city', v_cust->>'city',
                                   'zip', v_cust->>'zip', 'country', v_cust->>'country')
  where id = v_uid;

  return jsonb_build_object('order_number', v_number, 'total', v_total);
end $$;
revoke execute on function public.place_order(jsonb, jsonb, text) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, text) to authenticated;

-- Stamp the confirmation time when an admin confirms payment
create or replace function public.orders_status_stamp()
returns trigger language plpgsql as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then new.confirmed_at := now(); end if;
  return new;
end $$;
drop trigger if exists orders_status_stamp on public.orders;
create trigger orders_status_stamp before update on public.orders
  for each row execute function public.orders_status_stamp();

-- ---------- Product photos (Storage) ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product images: admin insert" on storage.objects;
create policy "product images: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product images: admin update" on storage.objects;
create policy "product images: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product images: admin delete" on storage.objects;
create policy "product images: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product images: admin list" on storage.objects;
create policy "product images: admin list" on storage.objects
  for select to authenticated using (bucket_id = 'product-images' and public.is_admin());
