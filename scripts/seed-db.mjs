import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'mulholland.sqlite3');

function seedDatabase() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT,
      description TEXT,
      price REAL NOT NULL,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE,
      channel TEXT,
      customer_name TEXT,
      total_usd REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_usd REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );
  `);

  // Check if admin user already exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@mulholland.com');
  
  if (!existingAdmin) {
    // Create default admin user
    const passwordHash = bcrypt.hashSync('admin123', 10);
    const adminId = crypto.randomUUID();
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash)
      VALUES (?, ?, ?)
    `).run(adminId, 'admin@mulholland.com', passwordHash);
    
    console.log('✅ Admin user created: admin@mulholland.com / admin123');
  }

  db.close();
  console.log('✅ Database initialized at:', dbPath);
}

seedDatabase();
