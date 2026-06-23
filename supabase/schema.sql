-- ============================================================
-- Mulholland Traders — Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order int default 0
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  description text,
  category_id uuid references categories(id),
  price_usd numeric(10,2) not null check (price_usd >= 0),
  stock_qty int not null default 0 check (stock_qty >= 0),
  is_second_hand boolean default true,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists products_active_stock_idx on products (is_active, stock_qty);
create index if not exists products_category_idx on products (category_id);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('online','pos')),
  customer_name text,
  customer_phone text,
  customer_address text,
  subtotal_usd numeric(10,2) not null,
  total_usd numeric(10,2) not null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists sales_created_at_idx on sales (created_at desc);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,
  unit_price_usd numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total_usd numeric(10,2) not null
);

create index if not exists sale_items_sale_idx on sale_items (sale_id);
create index if not exists sale_items_product_idx on sale_items (product_id);

create table if not exists pricelist_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  note text,
  sort_order int default 0
);

create table if not exists pricelist_rows (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references pricelist_categories(id) on delete cascade,
  part_no text,
  description text not null,
  qty_per_reel text,
  size text,
  unit text,
  price_usd numeric(10,2),
  sort_order int default 0
);

create index if not exists pricelist_rows_cat_idx on pricelist_rows (category_id, sort_order);

-- ============================================================
-- TRIGGER: Deduct stock on sale item insert
-- ============================================================

create or replace function deduct_stock_on_sale()
returns trigger language plpgsql as $$
declare
  current_stock int;
begin
  select stock_qty into current_stock
  from products
  where id = new.product_id
  for update;

  if current_stock is null then
    raise exception 'Product % not found', new.product_id;
  end if;

  if current_stock < new.quantity then
    raise exception 'Insufficient stock for product %: have %, need %',
      new.product_id, current_stock, new.quantity;
  end if;

  update products
  set
    stock_qty = stock_qty - new.quantity,
    updated_at = now()
  where id = new.product_id;

  return new;
end;
$$;

drop trigger if exists trg_deduct_stock on sale_items;
create trigger trg_deduct_stock
  after insert on sale_items
  for each row execute function deduct_stock_on_sale();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table admins enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table pricelist_categories enable row level security;
alter table pricelist_rows enable row level security;

-- Helper function: is current user an admin?
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from admins where id = auth.uid());
$$;

-- admins: row-owner select only
create policy "admins_self_select" on admins
  for select using (id = auth.uid());

-- categories: public read, admin write
create policy "categories_public_read" on categories
  for select using (true);
create policy "categories_admin_write" on categories
  for all using (is_admin());

-- products: public read (active + in stock), admin write
create policy "products_public_read" on products
  for select using (is_active = true and stock_qty > 0);
create policy "products_admin_all" on products
  for all using (is_admin());

-- sales: admin only
create policy "sales_admin_select" on sales
  for select using (is_admin());
create policy "sales_service_insert" on sales
  for insert with check (true);

-- sale_items: admin only
create policy "sale_items_admin_select" on sale_items
  for select using (is_admin());
create policy "sale_items_service_insert" on sale_items
  for insert with check (true);

-- pricelist: public read, admin write
create policy "pricelist_cat_public_read" on pricelist_categories
  for select using (true);
create policy "pricelist_cat_admin_write" on pricelist_categories
  for all using (is_admin());

create policy "pricelist_rows_public_read" on pricelist_rows
  for select using (true);
create policy "pricelist_rows_admin_write" on pricelist_rows
  for all using (is_admin());

-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or CLI)
-- ============================================================
-- create bucket 'product-images' (public: true)
-- create bucket 'invoices' (public: true)
