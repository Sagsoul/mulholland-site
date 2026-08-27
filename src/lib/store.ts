import { v4 as uuidv4 } from "uuid";
import { all, get, run, exec } from "@/lib/db";

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface ProductRecord {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  stock_qty: number;
  image_url: string | null;
  is_active: number;
  created_at: string;
}

export interface SaleRecord {
  id: string;
  invoice_number: string;
  channel: string;
  customer_name: string | null;
  total_usd: number;
  created_at: string;
  items?: SaleItemRecord[];
}

export interface SaleItemRecord {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price_usd: number;
}

export interface GetProductsOptions {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateProductInput {
  name: string;
  sku?: string | null;
  description?: string | null;
  price: number;
  stock_qty?: number;
  image_url?: string | null;
  is_active?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string | null;
  description?: string | null;
  price?: number;
  stock_qty?: number;
  image_url?: string | null;
  is_active?: boolean;
}

export interface CreateSaleInput {
  channel: string;
  customer_name?: string | null;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price_usd?: number;
  }>;
}

function normalizeProduct(product: ProductRecord) {
  return {
    ...product,
    is_active: Boolean(product.is_active),
    price_usd: product.price,
  };
}

function createInvoiceNumber() {
  const now = new Date();
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${date}-${suffix}`;
}

export async function getCategories() {
  return all<CategoryRecord>(
    `SELECT id, slug, name, sort_order
     FROM categories
     ORDER BY sort_order ASC, name ASC`
  );
}

export async function getProducts(options: GetProductsOptions = {}) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.isActive === true) {
    conditions.push("is_active = 1");
  } else if (options.isActive === false) {
    conditions.push("is_active = 0");
  }

  if (options.search?.trim()) {
    conditions.push("(name LIKE ? OR sku LIKE ? OR description LIKE ?)");
    const term = `%${options.search.trim()}%`;
    params.push(term, term, term);
  }

  let sql = `SELECT id, name, sku, description, price, stock_qty, image_url, is_active, created_at
             FROM products`;

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += " ORDER BY created_at DESC";

  if (typeof options.limit === "number") {
    sql += " LIMIT ?";
    params.push(options.limit);

    if (typeof options.offset === "number") {
      sql += " OFFSET ?";
      params.push(options.offset);
    }
  }

  const products = await all<ProductRecord>(sql, params);
  return products.map((product) => normalizeProduct(product));
}

export async function getProductById(id: string) {
  const product = await get<ProductRecord>(
    `SELECT id, name, sku, description, price, stock_qty, image_url, is_active, created_at
     FROM products
     WHERE id = ?`,
    [id]
  );

  return product ? normalizeProduct(product) : null;
}

export async function createProduct(data: CreateProductInput) {
  if (!data.name?.trim()) {
    throw new Error("Product name is required");
  }

  if (!Number.isFinite(data.price) || data.price < 0) {
    throw new Error("Product price must be a non-negative number");
  }

  const stockQty = data.stock_qty ?? 0;
  if (!Number.isInteger(stockQty) || stockQty < 0) {
    throw new Error("Stock quantity must be a non-negative integer");
  }

  const id = uuidv4();
  await run(
    `INSERT INTO products (id, name, sku, description, price, stock_qty, image_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name.trim(),
      data.sku?.trim() || null,
      data.description?.trim() || null,
      data.price,
      stockQty,
      data.image_url?.trim() || null,
      data.is_active === false ? 0 : 1,
    ]
  );

  return getProductById(id);
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const currentProduct = await getProductById(id);
  if (!currentProduct) {
    return null;
  }

  const nextName = data.name?.trim() ?? currentProduct.name;
  const nextPrice = data.price ?? currentProduct.price;
  const nextStockQty = data.stock_qty ?? currentProduct.stock_qty;

  if (!nextName) {
    throw new Error("Product name is required");
  }

  if (!Number.isFinite(nextPrice) || nextPrice < 0) {
    throw new Error("Product price must be a non-negative number");
  }

  if (!Number.isInteger(nextStockQty) || nextStockQty < 0) {
    throw new Error("Stock quantity must be a non-negative integer");
  }

  await run(
    `UPDATE products
     SET name = ?, sku = ?, description = ?, price = ?, stock_qty = ?, image_url = ?, is_active = ?
     WHERE id = ?`,
    [
      nextName,
      data.sku === undefined ? currentProduct.sku : data.sku?.trim() || null,
      data.description === undefined ? currentProduct.description : data.description?.trim() || null,
      nextPrice,
      nextStockQty,
      data.image_url === undefined ? currentProduct.image_url : data.image_url?.trim() || null,
      data.is_active === undefined ? (currentProduct.is_active ? 1 : 0) : data.is_active ? 1 : 0,
      id,
    ]
  );

  return getProductById(id);
}

export async function deleteProduct(id: string) {
  const result = await run("DELETE FROM products WHERE id = ?", [id]);
  return result.changes > 0;
}

export async function getSales() {
  const sales = await all<SaleRecord>(
    `SELECT id, invoice_number, channel, customer_name, total_usd, created_at
     FROM sales
     ORDER BY created_at DESC`
  );

  if (sales.length === 0) {
    return sales;
  }

  const itemRows = await all<SaleItemRecord>(
    `SELECT id, sale_id, product_id, quantity, unit_price_usd
     FROM sale_items
     WHERE sale_id IN (${sales.map(() => "?").join(",")})
     ORDER BY rowid ASC`,
    sales.map((sale) => sale.id)
  );

  const itemsBySaleId = new Map<string, SaleItemRecord[]>();
  for (const item of itemRows) {
    const currentItems = itemsBySaleId.get(item.sale_id) ?? [];
    currentItems.push(item);
    itemsBySaleId.set(item.sale_id, currentItems);
  }

  return sales.map((sale) => ({ ...sale, items: itemsBySaleId.get(sale.id) ?? [] }));
}

export async function createSale(data: CreateSaleInput) {
  if (!data.channel?.trim()) {
    throw new Error("Sale channel is required");
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("At least one sale item is required");
  }

  const saleId = uuidv4();
  const invoiceNumber = createInvoiceNumber();

  const productCache = new Map<string, ProductRecord>();
  const saleItems = [] as Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price_usd: number;
  }>;

  let total = 0;

  for (const item of data.items) {
    if (!item.product_id) {
      throw new Error("Each sale item must include product_id");
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Each sale item quantity must be a positive integer");
    }

    let product = productCache.get(item.product_id);
    if (!product) {
      product = await get<ProductRecord>(
        `SELECT id, name, sku, description, price, stock_qty, image_url, is_active, created_at
         FROM products WHERE id = ?`,
        [item.product_id]
      );

      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      productCache.set(item.product_id, product);
    }

    if (product.stock_qty < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const unitPrice = item.unit_price_usd ?? product.price;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error("Sale item unit price must be a non-negative number");
    }

    total += unitPrice * item.quantity;
    saleItems.push({
      id: uuidv4(),
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_usd: unitPrice,
    });
  }

  const roundedTotal = Math.round(total * 100) / 100;

  await exec("BEGIN TRANSACTION;");

  try {
    await run(
      `INSERT INTO sales (id, invoice_number, channel, customer_name, total_usd)
       VALUES (?, ?, ?, ?, ?)`,
      [saleId, invoiceNumber, data.channel.trim(), data.customer_name?.trim() || null, roundedTotal]
    );

    for (const item of saleItems) {
      await run(
        `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price_usd)
         VALUES (?, ?, ?, ?, ?)`,
        [item.id, saleId, item.product_id, item.quantity, item.unit_price_usd]
      );

      await run(
        "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    await exec("COMMIT;");
  } catch (error) {
    await exec("ROLLBACK;");
    throw error;
  }

  const sale = await get<SaleRecord>(
    `SELECT id, invoice_number, channel, customer_name, total_usd, created_at
     FROM sales WHERE id = ?`,
    [saleId]
  );

  if (!sale) {
    throw new Error("Failed to load created sale");
  }

  return {
    ...sale,
    items: saleItems,
  };
}

export async function getDashboardStats() {
  const [productCount, saleCount, revenueRow] = await Promise.all([
    get<{ count: number }>("SELECT COUNT(*) as count FROM products"),
    get<{ count: number }>("SELECT COUNT(*) as count FROM sales"),
    get<{ revenue: number | null }>("SELECT SUM(total_usd) as revenue FROM sales"),
  ]);

  return {
    productCount: productCount?.count ?? 0,
    saleCount: saleCount?.count ?? 0,
    revenue: revenueRow?.revenue ?? 0,
  };
}
