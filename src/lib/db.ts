import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";

let db: sqlite3.Database | null = null;

function getDatabasePath() {
  return process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "mulholland.sqlite3");
}

function initializeDatabase() {
  return new Promise<sqlite3.Database>((resolve, reject) => {
    const dbPath = getDatabasePath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const database = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Enable foreign keys
      database.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Create tables
        database.exec(
          `
          CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            stock_quantity INTEGER NOT NULL,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            invoice_number TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_amount REAL NOT NULL
          );

          CREATE TABLE IF NOT EXISTS invoice_items (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price_at_sale REAL NOT NULL,
            FOREIGN KEY(invoice_id) REFERENCES invoices(id),
            FOREIGN KEY(item_id) REFERENCES items(id)
          );

          CREATE TABLE IF NOT EXISTS applied_migrations (
            name TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            sku TEXT,
            name TEXT NOT NULL,
            description TEXT,
            category_id TEXT,
            price_usd REAL NOT NULL,
            stock_qty INTEGER NOT NULL DEFAULT 0,
            is_second_hand INTEGER DEFAULT 0,
            image_url TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
          );

          CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            slug TEXT UNIQUE,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS pricelist_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            note TEXT,
            sort_order INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS pricelist_rows (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            part_no TEXT,
            description TEXT NOT NULL,
            qty_per_reel INTEGER,
            size TEXT,
            unit TEXT,
            price_usd REAL,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY(category_id) REFERENCES pricelist_categories(id)
          );

          CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            invoice_number TEXT UNIQUE,
            channel TEXT,
            customer_name TEXT,
            customer_phone TEXT,
            customer_address TEXT,
            subtotal_usd REAL DEFAULT 0,
            total_usd REAL DEFAULT 0,
            notes TEXT,
            created_by TEXT,
            created_at TEXT
          );

          CREATE TABLE IF NOT EXISTS sale_items (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            unit_price_usd REAL NOT NULL,
            quantity INTEGER NOT NULL,
            line_total_usd REAL NOT NULL,
            FOREIGN KEY(sale_id) REFERENCES sales(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
          );

          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT
          );
          `,
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(database);
          }
        );
      });
    });
  });
}

export async function getDb() {
  if (db) {
    return db;
  }

  try {
    db = await initializeDatabase();
    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

// Synchronous wrapper for compatibility with existing code
class DbWrapper {
  constructor(private database: sqlite3.Database) {}

  prepare(sql: string) {
    return {
      all: (params?: any) => {
        return new Promise<any[]>((resolve, reject) => {
          const finalSql = this.replaceSqlParams(sql, params);
          this.database.all(finalSql, [], (err, rows) => {
            if (err) reject(err);
            else resolve((rows || []) as any[]);
          });
        });
      },
      get: (params?: any) => {
        return new Promise<any | undefined>((resolve, reject) => {
          const finalSql = this.replaceSqlParams(sql, params);
          this.database.get(finalSql, [], (err, row) => {
            if (err) reject(err);
            else resolve((row || undefined) as any);
          });
        });
      },
      run: (params?: any) => {
        return new Promise<{ changes: number; lastID?: number }>((resolve, reject) => {
          const finalSql = this.replaceSqlParams(sql, params);
          this.database.run(finalSql, [], function (err) {
            if (err) reject(err);
            else resolve({ changes: this.changes, lastID: this.lastID });
          });
        });
      },
    };
  }

  private replaceSqlParams(sql: string, params?: any) {
    if (!params || typeof params !== "object") {
      return sql;
    }

    let result = sql;
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `@${key}`;
      if (result.includes(placeholder)) {
        const escapedValue =
          value === null ? "NULL" : typeof value === "string" ? `'${value.replace(/'/g, "''")}'` : String(value);
        result = result.replace(new RegExp(placeholder, "g"), escapedValue);
      }
    }
    return result;
  }

  transaction(fn: () => void) {
    return () => {
      return new Promise<void>((resolve, reject) => {
        this.database.run("BEGIN TRANSACTION", (err) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            fn();
            this.database.run("COMMIT", (err) => {
              if (err) reject(err);
              else resolve();
            });
          } catch (error) {
            this.database.run("ROLLBACK", () => {
              reject(error);
            });
          }
        });
      });
    };
  }

  exec(sql: string) {
    return new Promise<void>((resolve, reject) => {
      this.database.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export async function dbAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const database = await getDb();
  return new Promise<T[]>((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows ?? []) as T[]);
    });
  });
}

export async function dbGet<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const database = await getDb();
  return new Promise<T | undefined>((resolve, reject) => {
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

export async function dbRun(sql: string, params: unknown[] = []): Promise<{ changes: number; lastID: number }> {
  const database = await getDb();
  return new Promise((resolve, reject) => {
    database.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

export async function dbTransaction<T>(fn: (helpers: {
  all: typeof dbAll;
  get: typeof dbGet;
  run: typeof dbRun;
}) => Promise<T>): Promise<T> {
  const database = await getDb();

  const run = (sql: string, params: unknown[] = []) =>
    new Promise<{ changes: number; lastID: number }>((resolve, reject) => {
      database.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });

  const all = <T2 = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    new Promise<T2[]>((resolve, reject) => {
      database.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows ?? []) as T2[]);
      });
    });

  const get = <T2 = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    new Promise<T2 | undefined>((resolve, reject) => {
      database.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T2 | undefined);
      });
    });

  await run("BEGIN");
  try {
    const result = await fn({ all: all as typeof dbAll, get: get as typeof dbGet, run });
    await run("COMMIT");
    return result;
  } catch (error) {
    await run("ROLLBACK").catch(() => {});
    throw error;
  }
}
