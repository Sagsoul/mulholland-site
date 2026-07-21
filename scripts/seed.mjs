import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const rootDir = process.cwd();
const dbPath = process.env.SQLITE_DB_PATH || path.join(rootDir, "data", "mulholland.sqlite3");
const migrationDir = path.join(rootDir, "database", "migrations");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

for (const file of fs.readdirSync(migrationDir).filter((name) => name.endsWith(".sql")).sort()) {
  db.exec(fs.readFileSync(path.join(migrationDir, file), "utf8"));
}

const now = new Date().toISOString();

const sampleProducts = [
  {
    id: "sample-pipe-bandage",
    sku: "FF-100",
    name: "Fibre Repair Bandage",
    description: "Fast-setting fiberglass repair bandage for burst pipes and emergency maintenance.",
    category_id: "pipe-repair",
    price_usd: 18.5,
    stock_qty: 12,
    is_second_hand: 0,
    image_url: null,
    is_active: 1,
  },
  {
    id: "sample-roof-coat",
    sku: "RF-220",
    name: "Heat Reflective Roof Coating",
    description: "Durable roof coating that reduces heat gain and helps waterproof exposed surfaces.",
    category_id: "paint",
    price_usd: 42,
    stock_qty: 6,
    is_second_hand: 0,
    image_url: null,
    is_active: 1,
  },
  {
    id: "sample-ladder",
    sku: "SH-001",
    name: "Second-Hand Folding Ladder",
    description: "Pre-owned aluminium folding ladder in good working condition.",
    category_id: "second-hand",
    price_usd: 95,
    stock_qty: 1,
    is_second_hand: 1,
    image_url: null,
    is_active: 1,
  },
];

const insertProduct = db.prepare(`
  INSERT INTO products (
    id, sku, name, description, category_id, price_usd, stock_qty, is_second_hand, image_url, is_active, created_at, updated_at
  ) VALUES (
    @id, @sku, @name, @description, @category_id, @price_usd, @stock_qty, @is_second_hand, @image_url, @is_active, @created_at, @updated_at
  )
  ON CONFLICT(id) DO UPDATE SET
    sku = excluded.sku,
    name = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price_usd = excluded.price_usd,
    stock_qty = excluded.stock_qty,
    is_second_hand = excluded.is_second_hand,
    image_url = excluded.image_url,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at
`);

for (const product of sampleProducts) {
  insertProduct.run({ ...product, created_at: now, updated_at: now });
}

const priceCategories = [
  { id: "pl-waterproofing", name: "Waterproofing", note: "Sample starter entries", sort_order: 1 },
  { id: "pl-repairs", name: "Repairs", note: "Sample starter entries", sort_order: 2 },
];

const priceRows = [
  {
    id: crypto.randomUUID(),
    category_id: "pl-waterproofing",
    part_no: "MT-WP-1",
    description: "Roof coating 5L",
    qty_per_reel: null,
    size: "5L",
    unit: "tin",
    price_usd: 42,
    sort_order: 1,
  },
  {
    id: crypto.randomUUID(),
    category_id: "pl-repairs",
    part_no: "MT-RP-1",
    description: "Fibre repair bandage",
    qty_per_reel: null,
    size: "100mm",
    unit: "roll",
    price_usd: 18.5,
    sort_order: 1,
  },
];

const insertPriceCategory = db.prepare(`
  INSERT INTO pricelist_categories (id, name, note, sort_order)
  VALUES (@id, @name, @note, @sort_order)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    note = excluded.note,
    sort_order = excluded.sort_order
`);

for (const category of priceCategories) {
  insertPriceCategory.run(category);
}

const existingRows = db.prepare("SELECT COUNT(*) AS count FROM pricelist_rows").get();
if ((existingRows?.count ?? 0) === 0) {
  const insertPriceRow = db.prepare(`
    INSERT INTO pricelist_rows (
      id, category_id, part_no, description, qty_per_reel, size, unit, price_usd, sort_order
    ) VALUES (
      @id, @category_id, @part_no, @description, @qty_per_reel, @size, @unit, @price_usd, @sort_order
    )
  `);
  for (const row of priceRows) {
    insertPriceRow.run(row);
  }
}

console.log(`Seeded SQLite data at ${dbPath}`);
