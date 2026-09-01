import { v4 as uuidv4 } from "uuid";
import { all, get, run } from "@/lib/db";

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
  images?: ProductImageOutput[];
  is_active: number;
  created_at: string;
}

export interface ProductImageOutput {
  id: string;
  image_path: string;
  sort_order: number;
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
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  stock_qty?: number;
  images?: string[] | null;
  is_active?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  price?: number;
  stock_qty?: number;
  images?: string[] | null;
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

interface ProductImageRecord {
  id: string;
  product_id: string;
  image_path: string;
  sort_order: number;
  created_at: string;
}

function normalizeProduct(product: ProductRecord, images: ProductImageOutput[] = []) {
  const firstImagePath = images[0]?.image_path ?? product.image_url ?? null;
  return {
    ...product,
    image_url: firstImagePath,
    images,
    is_active: Boolean(product.is_active),
    price_usd: product.price,
  };
}

function slugifyName(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function createRandomSixDigitCode() {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
}

function generateSku(name: string) {
  const slug = slugifyName(name);
  return `PRODUCT-${slug}-${createRandomSixDigitCode()}`;
}

function normalizeImagesInput(images?: string[] | null) {
  const source = Array.isArray(images) ? images : [];
  const normalized = source
    .map((value) => {
      if (typeof value !== "string") {
        throw new Error("Each image must be a string path");
      }
      return value.trim();
    })
    .filter(Boolean);

  if (normalized.length > 4) {
    throw new Error("A product can have at most 4 images");
  }

  return normalized;
}

async function getImagesByProductIds(productIds: string[]) {
  const imageMap = new Map<string, ProductImageOutput[]>();
  if (productIds.length === 0) {
    return imageMap;
  }

  const rows = await all<ProductImageRecord>(
    `SELECT id, product_id, image_path, sort_order, created_at
     FROM product_images
     WHERE product_id IN (${productIds.map(() => "?").join(",")})
     ORDER BY product_id ASC, sort_order ASC, created_at ASC`,
    productIds
  );

  for (const row of rows) {
    const current = imageMap.get(row.product_id) ?? [];
    current.push({ id: row.id, image_path: row.image_path, sort_order: row.sort_order });
    imageMap.set(row.product_id, current);
  }

  return imageMap;
}

async function replaceProductImages(productId: string, images: string[]) {
  await run("DELETE FROM product_images WHERE product_id = ?", [productId]);

  for (const [index, imagePath] of images.entries()) {
    await run(`INSERT INTO product_images (id, product_id, image_path, sort_order) VALUES (?, ?, ?, ?)`, [
      uuidv4(),
      productId,
      imagePath,
      index,
    ]);
  }
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
  const imageMap = await getImagesByProductIds(products.map((product) => product.id));
  return products.map((product) => normalizeProduct(product, imageMap.get(product.id) ?? []));
}

export async function getProductById(id: string) {
  const product = await get<ProductRecord>(
    `SELECT id, name, sku, description, price, stock_qty, image_url, is_active, created_at
     FROM products
     WHERE id = ?`,
    [id]
  );

  if (!product) {
    return null;
  }

  const imageMap = await getImagesByProductIds([id]);
  return normalizeProduct(product, imageMap.get(id) ?? []);
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

  const name = data.name.trim();
  const images = normalizeImagesInput(data.images);
  const id = data.id ?? uuidv4();
  const maxSkuAttempts = 20;

  for (let attempt = 0; attempt < maxSkuAttempts; attempt += 1) {
    const sku = generateSku(name);

    await run("BEGIN TRANSACTION;");
    try {
      await run(
        `INSERT INTO products (id, name, sku, description, price, stock_qty, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name,
          sku,
          data.description?.trim() || null,
          data.price,
          stockQty,
          images[0] ?? null,
          data.is_active === false ? 0 : 1,
        ]
      );
      await replaceProductImages(id, images);
      await run("COMMIT;");
      return getProductById(id);
    } catch (error: any) {
      await run("ROLLBACK;");
      if (typeof error?.message === "string" && error.message.includes("UNIQUE constraint failed: products.sku")) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Unable to generate a unique SKU, please try again");
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const currentProduct = await getProductById(id);
  if (!currentProduct) {
    return null;
  }

  const nextName = data.name?.trim() ?? currentProduct.name;
  const nextPrice = data.price ?? currentProduct.price;
  const nextStockQty = data.stock_qty ?? currentProduct.stock_qty;
  const existingImages = Array.isArray(currentProduct.images)
    ? currentProduct.images.map((img) => img.image_path)
    : [];
  const nextImages =
    data.images === undefined ? existingImages : normalizeImagesInput(data.images);

  if (!nextName) {
    throw new Error("Product name is required");
  }

  if (!Number.isFinite(nextPrice) || nextPrice < 0) {
    throw new Error("Product price must be a non-negative number");
  }

  if (!Number.isInteger(nextStockQty) || nextStockQty < 0) {
    throw new Error("Stock quantity must be a non-negative integer");
  }

  await run("BEGIN TRANSACTION;");
  try {
    await run(
      `UPDATE products
       SET name = ?, description = ?, price = ?, stock_qty = ?, image_url = ?, is_active = ?
       WHERE id = ?`,
      [
        nextName,
        data.description === undefined ? currentProduct.description : data.description?.trim() || null,
        nextPrice,
        nextStockQty,
        nextImages[0] ?? null,
        data.is_active === undefined ? (currentProduct.is_active ? 1 : 0) : data.is_active ? 1 : 0,
        id,
      ]
    );
    await replaceProductImages(id, nextImages);
    await run("COMMIT;");
  } catch (error: any) {
    await run("ROLLBACK;");
    throw error;
  }

  return getProductById(id);
}

export async function getProductBySku(sku: string) {
  const trimmedSku = sku.trim();
  if (!trimmedSku) {
    return null;
  }

  const product = await get<ProductRecord>(
    `SELECT id, name, sku, description, price, stock_qty, image_url, is_active, created_at
     FROM products
     WHERE sku = ?`,
    [trimmedSku]
  );

  if (!product) {
    return null;
  }

  const imageMap = await getImagesByProductIds([product.id]);
  return normalizeProduct(product, imageMap.get(product.id) ?? []);
}

export async function deleteProduct(id: string) {
  const result = await run("DELETE FROM products WHERE id = ?", [id]);
  return result.changes > 0;
}

export async function deleteProductImage(imageId: string, productId: string) {
  const result = await run("DELETE FROM product_images WHERE id = ? AND product_id = ?", [imageId, productId]);
  if (result.changes === 0) {
    return false;
  }
  const imageMap = await getImagesByProductIds([productId]);
  const remaining = imageMap.get(productId) ?? [];
  const firstPath = remaining[0]?.image_path ?? null;
  await run("UPDATE products SET image_url = ? WHERE id = ?", [firstPath, productId]);
  return true;
}

export async function reorderProductImages(productId: string, orderedImageIds: string[]) {
  const imageMap = await getImagesByProductIds([productId]);
  const existingImages = imageMap.get(productId) ?? [];
  const existingIds = new Set(existingImages.map((img) => img.id));

  for (const imageId of orderedImageIds) {
    if (!existingIds.has(imageId)) {
      throw new Error(`Image ${imageId} does not belong to product ${productId}`);
    }
  }

  await run("BEGIN TRANSACTION;");
  try {
    for (const [index, imageId] of orderedImageIds.entries()) {
      await run("UPDATE product_images SET sort_order = ? WHERE id = ? AND product_id = ?", [index, imageId, productId]);
    }
    await run("COMMIT;");
  } catch (error) {
    await run("ROLLBACK;");
    throw error;
  }

  const updatedMap = await getImagesByProductIds([productId]);
  const images = updatedMap.get(productId) ?? [];
  const firstPath = images[0]?.image_path ?? null;
  await run("UPDATE products SET image_url = ? WHERE id = ?", [firstPath, productId]);
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

  await run("BEGIN TRANSACTION;");

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

      const stockUpdateResult = await run(
        "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?",
        [item.quantity, item.product_id, item.quantity]
      );
      if (stockUpdateResult.changes === 0) {
        throw new Error("Insufficient stock to complete the sale");
      }
    }

    await run("COMMIT;");
  } catch (error) {
    await run("ROLLBACK;");
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
