import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

declare global {
  // eslint-disable-next-line no-var
  var __mulhollandDb: Database.Database | undefined;
}

function getDatabasePath() {
  return process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "mulholland.sqlite3");
}

function runMigrations(db: Database.Database) {
  const migrationsDir = path.join(process.cwd(), "database", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  db.exec("CREATE TABLE IF NOT EXISTS applied_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const applied = new Set(
    (db.prepare("SELECT name FROM applied_migrations").all() as Array<{ name: string }>).map((row) => row.name)
  );

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO applied_migrations (name, applied_at) VALUES (?, ?)").run(file, new Date().toISOString());
    });
    apply();
  }
}

export function getDb() {
  if (global.__mulhollandDb) {
    return global.__mulhollandDb;
  }

  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  global.__mulhollandDb = db;

  const journalMode = String(db.pragma("journal_mode = WAL", { simple: true }) ?? "").toLowerCase();
  db.pragma("foreign_keys = ON");
  if (journalMode !== "wal") {
    console.warn(`SQLite journal mode is "${journalMode}" instead of WAL`);
  }

  try {
    runMigrations(db);
    return db;
  } catch (error) {
    global.__mulhollandDb = undefined;
    throw error;
  }
}
