import crypto from "node:crypto";
import { getDb } from "./db";
import { Category, PricelistCategory, PricelistRow, Product, Sale, SaleItem } from "@/types";

type ProductRow = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  price_usd: number;
  stock_qty: number;
  is_second_hand: number;
  image_url: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  category_ref_id?: string | null;
  category_slug?: string | null;
  category_name?: string | null;
  category_sort_order?: number | null;
};

type SaleRow = Omit<Sale, "channel" | "sale_items" | "invoice_number"> & {
  channel: "online" | "pos";
  invoice_number: string;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    category_id: row.category_id,
    category: row.category_ref_id
      ? {
          id: row.category_ref_id,
          slug: row.category_slug ?? row.category_ref_id,
          name: row.category_name ?? row.category_ref_id,
          sort_order: row.category_sort_order ?? 0,
        }
      : undefined,
    price_usd: Number(row.price_usd),
    stock_qty: Number(row.stock_qty),
    is_second_hand: Boolean(row.is_second_hand),
    image_url: row.image_url,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapSaleItem(row: SaleItem): SaleItem {
  return {
    ...row,
    unit_price_usd: Number(row.unit_price_usd),
    quantity: Number(row.quantity),
    line_total_usd: Number(row.line_total_usd),
  };
}

function joinProductsBaseSql() {
  return `
    SELECT
      p.*,
      c.id AS category_ref_id,
      c.slug AS category_slug,
      c.name AS category_name,
      c.sort_order AS category_sort_order
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
  `;
}

export function getCategories(): Category[] {
  const db = getDb();
  return db
    .prepare("SELECT id, slug, name, sort_order FROM categories ORDER BY sort_order, name")
    .all() as Category[];
}

export function getProducts(options?: {
  includeInactive?: boolean;
  categorySlug?: string | null;
  q?: string | null;
  limit?: number;
}): Product[] {
  const db = getDb();
  const params: Record<string, string | number> = {};
  let sql = `${joinProductsBaseSql()} WHERE 1 = 1`;

  if (!options?.includeInactive) {
    sql += " AND p.is_active = 1 AND p.stock_qty > 0";
  }

  if (options?.categorySlug) {
    sql += " AND c.slug = @categorySlug";
    params.categorySlug = options.categorySlug;
  }

  if (options?.q) {
    sql += " AND (p.name LIKE @q OR COALESCE(p.sku, '') LIKE @q OR COALESCE(p.description, '') LIKE @q)";
    params.q = `%${options.q}%`;
  }

  sql += " ORDER BY p.created_at DESC";

  if (options?.limit) {
    sql += " LIMIT @limit";
    params.limit = options.limit;
  }

  return (db.prepare(sql).all(params) as ProductRow[]).map(mapProduct);
}

export function getProduct(id: string): Product | null {
  const db = getDb();
  const row = db
    .prepare(`${joinProductsBaseSql()} WHERE p.id = ? LIMIT 1`)
    .get(id) as ProductRow | undefined;

  return row ? mapProduct(row) : null;
}

function normalizeProductInput(input: Partial<Product>) {
  const price = Number(input.price_usd ?? 0);
  const stock = Number(input.stock_qty ?? 0);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be zero or greater");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("Stock quantity must be a whole number zero or greater");
  }

  return {
    sku: input.sku?.trim() || null,
    name: input.name?.trim() || "",
    description: input.description?.trim() || null,
    category_id: input.category_id?.trim() || null,
    price_usd: price,
    stock_qty: stock,
    is_second_hand: input.is_second_hand ? 1 : 0,
    image_url: input.image_url?.trim() || null,
    is_active: input.is_active === false ? 0 : 1,
  };
}

export function createProduct(input: Partial<Product>) {
  const db = getDb();
  const payload = normalizeProductInput(input);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO products (
      id, sku, name, description, category_id, price_usd, stock_qty, is_second_hand, image_url, is_active, created_at, updated_at
    ) VALUES (
      @id, @sku, @name, @description, @category_id, @price_usd, @stock_qty, @is_second_hand, @image_url, @is_active, @created_at, @updated_at
    )
  `).run({
    id,
    ...payload,
    created_at: now,
    updated_at: now,
  });

  return getProduct(id);
}

export function updateProduct(id: string, input: Partial<Product>) {
  const existing = getProduct(id);
  if (!existing) return null;

  const db = getDb();
  const payload = normalizeProductInput({ ...existing, ...input });
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE products
    SET
      sku = @sku,
      name = @name,
      description = @description,
      category_id = @category_id,
      price_usd = @price_usd,
      stock_qty = @stock_qty,
      is_second_hand = @is_second_hand,
      image_url = @image_url,
      is_active = @is_active,
      updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    ...payload,
    updated_at: now,
  });

  return getProduct(id);
}

export function deleteProduct(id: string) {
  const db = getDb();
  return db.prepare("DELETE FROM products WHERE id = ?").run(id).changes > 0;
}

export function getPriceList(): PricelistCategory[] {
  const db = getDb();
  const categories = db
    .prepare("SELECT id, name, note, sort_order FROM pricelist_categories ORDER BY sort_order, name")
    .all() as PricelistCategory[];
  const rows = db
    .prepare(`
      SELECT id, category_id, part_no, description, qty_per_reel, size, unit, price_usd, sort_order
      FROM pricelist_rows
      ORDER BY sort_order, description
    `)
    .all() as PricelistRow[];

  return categories.map((category) => ({
    ...category,
    pricelist_rows: rows
      .filter((row) => row.category_id === category.id)
      .map((row) => ({
        ...row,
        price_usd: row.price_usd == null ? null : Number(row.price_usd),
      })),
  }));
}

export function savePriceList(categories: PricelistCategory[]) {
  const db = getDb();
  const save = db.transaction(() => {
    for (const category of categories) {
      db.prepare(`
        INSERT INTO pricelist_categories (id, name, note, sort_order)
        VALUES (@id, @name, @note, @sort_order)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          note = excluded.note,
          sort_order = excluded.sort_order
      `).run({
        id: category.id,
        name: category.name,
        note: category.note ?? null,
        sort_order: category.sort_order,
      });

      for (const row of category.pricelist_rows ?? []) {
        db.prepare(`
          INSERT INTO pricelist_rows (id, category_id, part_no, description, qty_per_reel, size, unit, price_usd, sort_order)
          VALUES (@id, @category_id, @part_no, @description, @qty_per_reel, @size, @unit, @price_usd, @sort_order)
          ON CONFLICT(id) DO UPDATE SET
            part_no = excluded.part_no,
            description = excluded.description,
            qty_per_reel = excluded.qty_per_reel,
            size = excluded.size,
            unit = excluded.unit,
            price_usd = excluded.price_usd,
            sort_order = excluded.sort_order
        `).run({
          id: row.id,
          category_id: category.id,
          part_no: row.part_no ?? null,
          description: row.description,
          qty_per_reel: row.qty_per_reel ?? null,
          size: row.size ?? null,
          unit: row.unit ?? null,
          price_usd: row.price_usd ?? null,
          sort_order: row.sort_order,
        });
      }
    }
  });

  save();
}

function getNextInvoiceNumber(now: string) {
  const db = getDb();
  const current = Number(
    (
      db.prepare("SELECT value FROM settings WHERE key = 'invoice_sequence'").get() as
        | { value?: string }
        | undefined
    )?.value ?? "0"
  );
  const next = current + 1;
  db.prepare("UPDATE settings SET value = ?, updated_at = ? WHERE key = 'invoice_sequence'").run(String(next), now);
  return `INV-${now.slice(0, 10).replace(/-/g, "")}-${String(next).padStart(6, "0")}`;
}

function getSaleItemsForSaleIds(saleIds: string[]) {
  const safeSaleIds = saleIds.filter((saleId) =>
    /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(saleId)
  );
  if (safeSaleIds.length === 0) return [] as SaleItem[];
  const db = getDb();
  const placeholders = safeSaleIds.map(() => "?").join(", ");
  return (db
    .prepare(`
      SELECT id, sale_id, product_id, product_name, unit_price_usd, quantity, line_total_usd
      FROM sale_items
      WHERE sale_id IN (${placeholders})
      ORDER BY rowid ASC
    `)
    .all(...safeSaleIds) as SaleItem[]).map(mapSaleItem);
}

export function getSale(id: string): Sale | null {
  const db = getDb();
  const sale = db
    .prepare(`
      SELECT id, invoice_number, channel, customer_name, customer_phone, customer_address, subtotal_usd, total_usd, notes, created_by, created_at
      FROM sales
      WHERE id = ?
      LIMIT 1
    `)
    .get(id) as SaleRow | undefined;

  if (!sale) return null;

  const saleItems = getSaleItemsForSaleIds([id]).filter((item) => item.sale_id === id);
  return {
    ...sale,
    subtotal_usd: Number(sale.subtotal_usd),
    total_usd: Number(sale.total_usd),
    sale_items: saleItems,
  };
}

export function getSales(options?: {
  channel?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
}): Sale[] {
  const db = getDb();
  const params: Record<string, string | number> = {
    limit: options?.limit ?? 200,
  };
  let sql = `
    SELECT id, invoice_number, channel, customer_name, customer_phone, customer_address, subtotal_usd, total_usd, notes, created_by, created_at
    FROM sales
    WHERE 1 = 1
  `;

  if (options?.channel) {
    sql += " AND channel = @channel";
    params.channel = options.channel;
  }
  if (options?.from) {
    sql += " AND created_at >= @from";
    params.from = options.from;
  }
  if (options?.to) {
    sql += " AND created_at <= @to";
    params.to = options.to;
  }

  sql += " ORDER BY created_at DESC LIMIT @limit";

  const sales = db.prepare(sql).all(params) as SaleRow[];
  const items = getSaleItemsForSaleIds(sales.map((sale) => sale.id));

  return sales.map((sale) => ({
    ...sale,
    subtotal_usd: Number(sale.subtotal_usd),
    total_usd: Number(sale.total_usd),
    sale_items: items.filter((item) => item.sale_id === sale.id),
  }));
}

export function createSale(input: {
  channel: "online" | "pos";
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  notes?: string | null;
  items: Array<{ product_id: string; quantity: number }>;
  created_by?: string | null;
}) {
  const db = getDb();
  const items = input.items.filter((item) => item.quantity > 0);

  if (items.length === 0) {
    throw new Error("No items provided");
  }

  const create = db.transaction(() => {
    const productIds = Array.from(new Set(items.map((item) => item.product_id)));
    const placeholders = productIds.map(() => "?").join(", ");
    const products = db
      .prepare(`
        SELECT id, name, price_usd, stock_qty, is_active
        FROM products
        WHERE id IN (${placeholders})
      `)
      .all(...productIds) as Array<{
      id: string;
      name: string;
      price_usd: number;
      stock_qty: number;
      is_active: number;
    }>;

    for (const item of items) {
      const product = products.find((candidate) => candidate.id === item.product_id);
      if (!product || !product.is_active) {
        throw new Error(`Product ${item.product_id} not found or inactive`);
      }
      if (product.stock_qty < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}": have ${product.stock_qty}, need ${item.quantity}`);
      }
    }

    const now = new Date().toISOString();
    const saleId = crypto.randomUUID();
    const invoiceNumber = getNextInvoiceNumber(now);

    const saleItems = items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.product_id)!;
      return {
        id: crypto.randomUUID(),
        sale_id: saleId,
        product_id: item.product_id,
        product_name: product.name,
        unit_price_usd: Number(product.price_usd),
        quantity: item.quantity,
        line_total_usd: Number(product.price_usd) * item.quantity,
      };
    });

    const subtotal = saleItems.reduce((sum, item) => sum + item.line_total_usd, 0);

    db.prepare(`
      INSERT INTO sales (
        id, invoice_number, channel, customer_name, customer_phone, customer_address, subtotal_usd, total_usd, notes, created_by, created_at
      ) VALUES (
        @id, @invoice_number, @channel, @customer_name, @customer_phone, @customer_address, @subtotal_usd, @total_usd, @notes, @created_by, @created_at
      )
    `).run({
      id: saleId,
      invoice_number: invoiceNumber,
      channel: input.channel,
      customer_name: input.customer_name?.trim() || null,
      customer_phone: input.customer_phone?.trim() || null,
      customer_address: input.customer_address?.trim() || null,
      subtotal_usd: subtotal,
      total_usd: subtotal,
      notes: input.notes?.trim() || null,
      created_by: input.created_by?.trim() || null,
      created_at: now,
    });

    const insertSaleItem = db.prepare(`
      INSERT INTO sale_items (
        id, sale_id, product_id, product_name, unit_price_usd, quantity, line_total_usd
      ) VALUES (
        @id, @sale_id, @product_id, @product_name, @unit_price_usd, @quantity, @line_total_usd
      )
    `);

    const updateStock = db.prepare(`
      UPDATE products
      SET stock_qty = stock_qty - @quantity, updated_at = @updated_at
      WHERE id = @product_id AND stock_qty >= @quantity
    `);

    for (const saleItem of saleItems) {
      const result = updateStock.run({
        product_id: saleItem.product_id,
        quantity: saleItem.quantity,
        updated_at: now,
      });

      if (result.changes === 0) {
        throw new Error(`Insufficient stock for "${saleItem.product_name}"`);
      }

      insertSaleItem.run(saleItem);
    }

    return saleId;
  });

  const saleId = create();
  return getSale(saleId)!;
}

export function getDashboardStats() {
  const db = getDb();
  const activeProducts =
    (
      db.prepare("SELECT COUNT(*) AS count FROM products WHERE is_active = 1 AND stock_qty > 0").get() as
        | { count?: number }
        | undefined
    )?.count ?? 0;
  const outOfStock =
    (
      db.prepare("SELECT COUNT(*) AS count FROM products WHERE is_active = 1 AND stock_qty = 0").get() as
        | { count?: number }
        | undefined
    )?.count ?? 0;
  const recentSales = getSales({ limit: 50 });
  return {
    activeProducts,
    outOfStock,
    totalRevenue: recentSales.reduce((sum, sale) => sum + sale.total_usd, 0),
    onlineSales: recentSales.filter((sale) => sale.channel === "online").length,
    posSales: recentSales.filter((sale) => sale.channel === "pos").length,
    recentSales: recentSales.slice(0, 5),
  };
}
