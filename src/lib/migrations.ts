import type sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const DEV_FALLBACK_PASSWORD = "change-me";
let hasWarnedAboutDevFallbackPassword = false;

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
  {
    id: "002_auth_verification_and_reset_tokens",
    sql: `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
    `,
  },
  {
    id: "003_product_images",
    sql: `
      CREATE TABLE IF NOT EXISTS product_images (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_product_images_product_id_sort_order
        ON product_images(product_id, sort_order);

      INSERT INTO product_images (id, product_id, image_url, sort_order)
      SELECT
        lower(
          hex(randomblob(4)) || '-' ||
          hex(randomblob(2)) || '-' ||
          '4' || substr(hex(randomblob(2)), 2) || '-' ||
          substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' ||
          hex(randomblob(6))
        ),
        p.id,
        p.image_url,
        0
      FROM products p
      WHERE p.image_url IS NOT NULL
        AND trim(p.image_url) <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM product_images pi
          WHERE pi.product_id = p.id
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
    if (!hasWarnedAboutDevFallbackPassword) {
      console.warn("ADMIN_PASSWORD is not set; using development fallback password for the seeded admin user.");
      hasWarnedAboutDevFallbackPassword = true;
    }
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
      await runner.runRaw(db, "UPDATE users SET password_hash = ?, email_verified = 1 WHERE id = ?", [
        passwordHash,
        existing.id,
      ]);
    } else {
      await runner.runRaw(db, "UPDATE users SET email_verified = 1 WHERE id = ?", [existing.id]);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await runner.runRaw(
    db,
    "INSERT INTO users (id, email, password_hash, email_verified) VALUES (?, ?, ?, 1)",
    [uuidv4(), email, passwordHash]
  );
}

async function ensureUsersEmailVerifiedColumn(db: sqlite3.Database, runner: Runner) {
  const columns = await runner.getRaw<{ hasColumn: number }>(
    db,
    `SELECT COUNT(1) AS hasColumn
     FROM pragma_table_info('users')
     WHERE name = 'email_verified'`
  );

  if (!columns?.hasColumn) {
    await runner.execRaw(db, "ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;");
  }
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

  await ensureUsersEmailVerifiedColumn(db, runner);
  await ensureDefaultAdminUser(db, runner);
  await ensureDefaultCategories(db, runner);
}
