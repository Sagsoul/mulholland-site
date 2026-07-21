CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price_usd REAL NOT NULL CHECK (price_usd >= 0),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_second_hand INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK (channel IN ('online', 'pos')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  subtotal_usd REAL NOT NULL,
  total_usd REAL NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price_usd REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_usd REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS pricelist_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricelist_rows (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES pricelist_categories(id) ON DELETE CASCADE,
  part_no TEXT,
  description TEXT NOT NULL,
  qty_per_reel TEXT,
  size TEXT,
  unit TEXT,
  price_usd REAL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active_stock ON products(is_active, stock_qty);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_pricelist_rows_category_id ON pricelist_rows(category_id);

INSERT OR IGNORE INTO categories (id, slug, name, sort_order) VALUES
  ('second-hand', 'second-hand', 'Second-Hand', 1),
  ('pipe-repair', 'pipe-repair', 'Pipe Repair', 2),
  ('roof-repair', 'roof-repair', 'Roof Repair', 3),
  ('paint', 'paint', 'Paint & Coatings', 4),
  ('rust-converter', 'rust-converter', 'Rust Converter', 5),
  ('hardware', 'hardware', 'Hardware', 6);

INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
  ('invoice_sequence', '0', CURRENT_TIMESTAMP);
