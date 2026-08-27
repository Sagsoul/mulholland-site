import type sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const DEV_FALLBACK_PASSWORD = "change-me";

const MIGRATIONS: Array<{ id: string; sql: string }> = [
  {
    id: "001_initial_schema",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        stock_qty INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        channel TEXT NOT NULL,
        customer_name TEXT,
        total_usd REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price_usd REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      );
    `,
  },
];

type Runner = {
  execRaw: (db: sqlite3.Database, sql: string) => Promise<void>;
  runRaw: (db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<{ lastID: number; changes: number }>;
  getRaw: <T>(db: sqlite3.Database, sql: string, params?: unknown[]) => Promise<T | undefined>;
};

function getDefaultAdminEmail() {
  return (process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
}

function getDefaultAdminPassword() {
  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }

  if (process.env.NODE_ENV === "development") {
    return DEV_FALLBACK_PASSWORD;
  }

  return null;
}

async function ensureDefaultAdminUser(db: sqlite3.Database, runner: Runner) {
  const password = getDefaultAdminPassword();
  if (!password) {
    return;
  }

  const email = getDefaultAdminEmail();
  const existing = await runner.getRaw<{ id: string; password_hash: string }>(
    db,
    "SELECT id, password_hash FROM users WHERE email = ?",
    [email]
  );

  if (existing) {
    const isCurrentHashValid = await bcrypt.compare(password, existing.password_hash);
    if (!isCurrentHashValid) {
      const passwordHash = await bcrypt.hash(password, 12);
      await runner.runRaw(db, "UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, existing.id]);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await runner.runRaw(
    db,
    "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
    [uuidv4(), email, passwordHash]
  );
}

async function ensureDefaultCategories(db: sqlite3.Database, runner: Runner) {
  const categories = [
    { slug: "general", name: "General", sortOrder: 0 },
    { slug: "featured", name: "Featured", sortOrder: 1 },
  ];

  for (const category of categories) {
    await runner.runRaw(
      db,
      `INSERT INTO categories (id, slug, name, sort_order)
       SELECT ?, ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = ?)`,
      [uuidv4(), category.slug, category.name, category.sortOrder, category.slug]
    );
  }
}

export async function runMigrations(db: sqlite3.Database, runner: Runner) {
  await runner.execRaw(
    db,
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`
  );

  for (const migration of MIGRATIONS) {
    const existing = await runner.getRaw<{ id: string }>(
      db,
      "SELECT id FROM schema_migrations WHERE id = ?",
      [migration.id]
    );

    if (existing) {
      continue;
    }

    await runner.execRaw(db, "BEGIN TRANSACTION;");
    try {
      await runner.execRaw(db, migration.sql);
      await runner.runRaw(db, "INSERT INTO schema_migrations (id) VALUES (?)", [migration.id]);
      await runner.execRaw(db, "COMMIT;");
    } catch (error) {
      await runner.execRaw(db, "ROLLBACK;");
      throw error;
    }
  }

  await ensureDefaultAdminUser(db, runner);
  await ensureDefaultCategories(db, runner);
}
