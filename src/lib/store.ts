import crypto from "node:crypto";
import { dbAll, dbGet, dbRun, dbTransaction } from "./db";
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

export async function getCategories(): Promise<Category[]> {
  return dbAll<Category>("SELECT id, slug, name, sort_order FROM categories ORDER BY sort_order, name");
}

export async function getProducts(options?: {
  includeInactive?: boolean;
  categorySlug?: string | null;
  q?: string | null;
  limit?: number;
}): Promise<Product[]> {
  const params: unknown[] = [];
  let sql = `${joinProductsBaseSql()} WHERE 1 = 1`;

  if (!options?.includeInactive) {
    sql += " AND p.is_active = 1 AND p.stock_qty > 0";
  }

  if (options?.categorySlug) {
    sql += " AND c.slug = ?";
    params.push(options.categorySlug);
  }

  if (options?.q) {
    sql += " AND (p.name LIKE ? OR COALESCE(p.sku, '') LIKE ? OR COALESCE(p.description, '') LIKE ?)";
    params.push(`%${options.q}%`, `%${options.q}%`, `%${options.q}%`);
  }

  sql += " ORDER BY p.created_at DESC";

  if (options?.limit) {
    sql += " LIMIT ?";
    params.push(options.limit);
  }

  const rows = await dbAll<ProductRow>(sql, params);
  return rows.map(mapProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const row = await dbGet<ProductRow>(`${joinProductsBaseSql()} WHERE p.id = ? LIMIT 1`, [id]);
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

export async function createProduct(input: Partial<Product>): Promise<Product | null> {
  const payload = normalizeProductInput(input);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await dbRun(
    `INSERT INTO products (
      id, sku, name, description, category_id, price_usd, stock_qty, is_second_hand, image_url, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, payload.sku, payload.name, payload.description, payload.category_id, payload.price_usd,
     payload.stock_qty, payload.is_second_hand, payload.image_url, payload.is_active, now, now]
  );

  return getProduct(id);
}

export async function updateProduct(id: string, input: Partial<Product>): Promise<Product | null> {
  const existing = await getProduct(id);
  if (!existing) return null;

  const payload = normalizeProductInput({ ...existing, ...input });
  const now = new Date().toISOString();

  await dbRun(
    `UPDATE products
     SET sku = ?, name = ?, description = ?, category_id = ?, price_usd = ?, stock_qty = ?,
         is_second_hand = ?, image_url = ?, is_active = ?, updated_at = ?
     WHERE id = ?`,
    [payload.sku, payload.name, payload.description, payload.category_id, payload.price_usd,
     payload.stock_qty, payload.is_second_hand, payload.image_url, payload.is_active, now, id]
  );

  return getProduct(id);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await dbRun("DELETE FROM products WHERE id = ?", [id]);
  return result.changes > 0;
}

export async function getPriceList(): Promise<PricelistCategory[]> {
  const categories = await dbAll<PricelistCategory>(
    "SELECT id, name, note, sort_order FROM pricelist_categories ORDER BY sort_order, name"
  );
  const rows = await dbAll<PricelistRow>(
    `SELECT id, category_id, part_no, description, qty_per_reel, size, unit, price_usd, sort_order
     FROM pricelist_rows ORDER BY sort_order, description`
  );

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

export async function savePriceList(categories: PricelistCategory[]): Promise<void> {
  await dbTransaction(async ({ run }) => {
    for (const category of categories) {
      await run(
        `INSERT INTO pricelist_categories (id, name, note, sort_order)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, note = excluded.note, sort_order = excluded.sort_order`,
        [category.id, category.name, category.note ?? null, category.sort_order]
      );

      for (const row of category.pricelist_rows ?? []) {
        await run(
          `INSERT INTO pricelist_rows (id, category_id, part_no, description, qty_per_reel, size, unit, price_usd, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             part_no = excluded.part_no, description = excluded.description,
             qty_per_reel = excluded.qty_per_reel, size = excluded.size, unit = excluded.unit,
             price_usd = excluded.price_usd, sort_order = excluded.sort_order`,
          [row.id, category.id, row.part_no ?? null, row.description,
           row.qty_per_reel ?? null, row.size ?? null, row.unit ?? null,
           row.price_usd ?? null, row.sort_order]
        );
      }
    }
  });
}

async function getNextInvoiceNumber(now: string): Promise<string> {
  const row = await dbGet<{ value?: string }>("SELECT value FROM settings WHERE key = 'invoice_sequence'");
  const current = Number(row?.value ?? "0");
  const next = current + 1;
  await dbRun("UPDATE settings SET value = ?, updated_at = ? WHERE key = 'invoice_sequence'", [String(next), now]);
  return `INV-${now.slice(0, 10).replace(/-/g, "")}-${String(next).padStart(6, "0")}`;
}

async function getSaleItemsForSaleIds(saleIds: string[]): Promise<SaleItem[]> {
  const safeSaleIds = saleIds.filter((saleId) =>
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(saleId)
  );
  if (safeSaleIds.length === 0) return [];
  const placeholders = safeSaleIds.map(() => "?").join(", ");
  const rows = await dbAll<SaleItem>(
    `SELECT id, sale_id, product_id, product_name, unit_price_usd, quantity, line_total_usd
     FROM sale_items WHERE sale_id IN (${placeholders}) ORDER BY rowid ASC`,
    safeSaleIds
  );
  return rows.map(mapSaleItem);
}

export async function getSale(id: string): Promise<Sale | null> {
  const sale = await dbGet<SaleRow>(
    `SELECT id, invoice_number, channel, customer_name, customer_phone, customer_address,
            subtotal_usd, total_usd, notes, created_by, created_at
     FROM sales WHERE id = ? LIMIT 1`,
    [id]
  );

  if (!sale) return null;

  const saleItems = (await getSaleItemsForSaleIds([id])).filter((item) => item.sale_id === id);
  return {
    ...sale,
    subtotal_usd: Number(sale.subtotal_usd),
    total_usd: Number(sale.total_usd),
    sale_items: saleItems,
  };
}

export async function getSales(options?: {
  channel?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
}): Promise<Sale[]> {
  const params: unknown[] = [];
  let sql = `
    SELECT id, invoice_number, channel, customer_name, customer_phone, customer_address,
           subtotal_usd, total_usd, notes, created_by, created_at
    FROM sales WHERE 1 = 1
  `;

  if (options?.channel) {
    sql += " AND channel = ?";
    params.push(options.channel);
  }
  if (options?.from) {
    sql += " AND created_at >= ?";
    params.push(options.from);
  }
  if (options?.to) {
    sql += " AND created_at <= ?";
    params.push(options.to);
  }

  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(options?.limit ?? 200);

  const sales = await dbAll<SaleRow>(sql, params);
  const items = await getSaleItemsForSaleIds(sales.map((sale) => sale.id));

  return sales.map((sale) => ({
    ...sale,
    subtotal_usd: Number(sale.subtotal_usd),
    total_usd: Number(sale.total_usd),
    sale_items: items.filter((item) => item.sale_id === sale.id),
  }));
}

export async function createSale(input: {
  channel: "online" | "pos";
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  notes?: string | null;
  items: Array<{ product_id: string; quantity: number }>;
  created_by?: string | null;
}): Promise<Sale> {
  const items = input.items.filter((item) => item.quantity > 0);

  if (items.length === 0) {
    throw new Error("No items provided");
  }

  const saleId = await dbTransaction(async ({ all, run, get }) => {
    const productIds = Array.from(new Set(items.map((item) => item.product_id)));
    const placeholders = productIds.map(() => "?").join(", ");
    const products = await all<{
      id: string;
      name: string;
      price_usd: number;
      stock_qty: number;
      is_active: number;
    }>(
      `SELECT id, name, price_usd, stock_qty, is_active FROM products WHERE id IN (${placeholders})`,
      productIds
    );

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
    const id = crypto.randomUUID();

    // get invoice number inside transaction
    const seqRow = await get<{ value?: string }>("SELECT value FROM settings WHERE key = 'invoice_sequence'");
    const current = Number(seqRow?.value ?? "0");
    const next = current + 1;
    await run("UPDATE settings SET value = ?, updated_at = ? WHERE key = 'invoice_sequence'", [String(next), now]);
    const invoiceNumber = `INV-${now.slice(0, 10).replace(/-/g, "")}-${String(next).padStart(6, "0")}`;

    const saleItems = items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.product_id)!;
      return {
        id: crypto.randomUUID(),
        sale_id: id,
        product_id: item.product_id,
        product_name: product.name,
        unit_price_usd: Number(product.price_usd),
        quantity: item.quantity,
        line_total_usd: Number(product.price_usd) * item.quantity,
      };
    });

    const subtotal = saleItems.reduce((sum, item) => sum + item.line_total_usd, 0);

    await run(
      `INSERT INTO sales (
        id, invoice_number, channel, customer_name, customer_phone, customer_address,
        subtotal_usd, total_usd, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, invoiceNumber, input.channel,
        input.customer_name?.trim() || null,
        input.customer_phone?.trim() || null,
        input.customer_address?.trim() || null,
        subtotal, subtotal,
        input.notes?.trim() || null,
        input.created_by?.trim() || null,
        now,
      ]
    );

    for (const saleItem of saleItems) {
      const result = await run(
        `UPDATE products SET stock_qty = stock_qty - ?, updated_at = ?
         WHERE id = ? AND stock_qty >= ?`,
        [saleItem.quantity, now, saleItem.product_id, saleItem.quantity]
      );

      if (result.changes === 0) {
        throw new Error(`Insufficient stock for "${saleItem.product_name}"`);
      }

      await run(
        `INSERT INTO sale_items (id, sale_id, product_id, product_name, unit_price_usd, quantity, line_total_usd)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [saleItem.id, saleItem.sale_id, saleItem.product_id, saleItem.product_name,
         saleItem.unit_price_usd, saleItem.quantity, saleItem.line_total_usd]
      );
    }

    return id;
  });

  return (await getSale(saleId))!;
}

export async function getDashboardStats() {
  const activeRow = await dbGet<{ count?: number }>(
    "SELECT COUNT(*) AS count FROM products WHERE is_active = 1 AND stock_qty > 0"
  );
  const outOfStockRow = await dbGet<{ count?: number }>(
    "SELECT COUNT(*) AS count FROM products WHERE is_active = 1 AND stock_qty = 0"
  );
  const recentSales = await getSales({ limit: 50 });
  return {
    activeProducts: activeRow?.count ?? 0,
    outOfStock: outOfStockRow?.count ?? 0,
    totalRevenue: recentSales.reduce((sum, sale) => sum + sale.total_usd, 0),
    onlineSales: recentSales.filter((sale) => sale.channel === "online").length,
    posSales: recentSales.filter((sale) => sale.channel === "pos").length,
    recentSales: recentSales.slice(0, 5),
  };
}
