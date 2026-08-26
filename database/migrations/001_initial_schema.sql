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
  category_id TEXT REFERENCES categories(id),
  price_usd REAL NOT NULL DEFAULT 0,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  is_second_hand INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK(channel IN ('online', 'pos')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  subtotal_usd REAL NOT NULL DEFAULT 0,
  total_usd REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price_usd REAL NOT NULL,
  quantity INTEGER NOT NULL,
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
  category_id TEXT NOT NULL REFERENCES pricelist_categories(id),
  part_no TEXT,
  description TEXT NOT NULL,
  qty_per_reel TEXT,
  size TEXT,
  unit TEXT,
  price_usd REAL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value, updated_at)
VALUES ('invoice_sequence', '0', datetime('now'));
