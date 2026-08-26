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

export function runQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDb();
      database.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows || []) as T[]);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function runQuerySingle<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDb();
      database.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve((row as T | undefined) || null);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function runExec(sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      const database = await getDb();
      database.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
