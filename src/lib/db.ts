import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

const sqlite = sqlite3.verbose();

let dbPromise: Promise<sqlite3.Database> | null = null;
let initPromise: Promise<void> | null = null;

function getDbPath() {
  const configuredPath = process.env.SQLITE_DB_PATH ?? "./data/mulholland.sqlite3";
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

async function openDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const dbPath = getDbPath();
      await fs.mkdir(path.dirname(dbPath), { recursive: true });

      const db = await new Promise<sqlite3.Database>((resolve, reject) => {
        const instance = new sqlite.Database(dbPath, (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(instance);
        });
      });

      await execRaw(db, "PRAGMA foreign_keys = ON;");
      return db;
    })();
  }

  return dbPromise;
}

function runRaw(db: sqlite3.Database, sql: string, params: unknown[] = []) {
  return new Promise<{ lastID: number; changes: number }>((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getRaw<T>(db: sqlite3.Database, sql: string, params: unknown[] = []) {
  return new Promise<T | undefined>((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row as T | undefined);
    });
  });
}

function allRaw<T>(db: sqlite3.Database, sql: string, params: unknown[] = []) {
  return new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows as T[]);
    });
  });
}

function execRaw(db: sqlite3.Database, sql: string) {
  return new Promise<void>((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function initializeDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await openDb();
      const { runMigrations } = await import("@/lib/migrations");
      await runMigrations(db, { execRaw, runRaw, getRaw });
    })();
  }

  await initPromise;
}

export async function run(sql: string, params: unknown[] = []) {
  await initializeDatabase();
  const db = await openDb();
  return runRaw(db, sql, params);
}

export async function get<T>(sql: string, params: unknown[] = []) {
  await initializeDatabase();
  const db = await openDb();
  return getRaw<T>(db, sql, params);
}

export async function all<T>(sql: string, params: unknown[] = []) {
  await initializeDatabase();
  const db = await openDb();
  return allRaw<T>(db, sql, params);
}

export async function exec(sql: string) {
  await initializeDatabase();
  const db = await openDb();
  return execRaw(db, sql);
}
