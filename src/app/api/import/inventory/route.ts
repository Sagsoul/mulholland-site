import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth-route";
import { createProduct, getProductBySku, updateProduct } from "@/lib/store";

interface ParsedInventoryRow {
  name: string;
  sku?: string;
  price: number;
  stock_qty: number;
  description: string | null;
  is_active: boolean;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(content: string) {
  return content
    .replace(/\uFEFF/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseCsvLine(line));
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }
  throw new Error("is_active must be true or false");
}

function getColumnIndexes(headers: string[]) {
  const normalizedHeaders = headers.map((header) => header.toLowerCase());
  const indexes = {
    name: normalizedHeaders.indexOf("name"),
    sku: normalizedHeaders.indexOf("sku"),
    price: normalizedHeaders.indexOf("price"),
    stock_qty: normalizedHeaders.indexOf("stock_qty"),
    description: normalizedHeaders.indexOf("description"),
    is_active: normalizedHeaders.indexOf("is_active"),
  };

  if (
    indexes.name < 0 ||
    indexes.price < 0 ||
    indexes.stock_qty < 0 ||
    indexes.description < 0 ||
    indexes.is_active < 0
  ) {
    throw new Error("CSV must include headers: name, sku, price, stock_qty, description, is_active");
  }

  return indexes;
}

function parseInventoryRow(row: string[], indexes: ReturnType<typeof getColumnIndexes>) {
  const name = row[indexes.name]?.trim();
  const sku = indexes.sku >= 0 ? row[indexes.sku]?.trim() : "";
  const description = row[indexes.description]?.trim() ?? "";
  const rawPrice = row[indexes.price]?.trim();
  const rawStockQty = row[indexes.stock_qty]?.trim();
  const rawIsActive = row[indexes.is_active]?.trim();

  if (!name) {
    throw new Error("name is required");
  }

  const price = Number(rawPrice);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("price must be a non-negative number");
  }

  const stock_qty = Number(rawStockQty);
  if (!Number.isInteger(stock_qty) || stock_qty < 0) {
    throw new Error("stock_qty must be a non-negative integer");
  }

  if (!rawIsActive) {
    throw new Error("is_active is required");
  }

  return {
    name,
    sku: sku || undefined,
    price,
    stock_qty,
    description: description || null,
    is_active: parseBoolean(rawIsActive),
  } satisfies ParsedInventoryRow;
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required in 'file' field" }, { status: 400 });
    }

    const rows = parseCsv(await file.text());
    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV must include a header row and at least one data row" }, { status: 400 });
    }

    const indexes = getColumnIndexes(rows[0]);
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let index = 1; index < rows.length; index += 1) {
      const rowNumber = index + 1;
      try {
        const parsed = parseInventoryRow(rows[index], indexes);
        if (parsed.sku) {
          const existing = await getProductBySku(parsed.sku);
          if (existing) {
            await updateProduct(existing.id, parsed);
            updated += 1;
            continue;
          }
        }

        await createProduct(parsed);
        created += 1;
      } catch (error: any) {
        errors.push(`Row ${rowNumber}: ${error?.message ?? "Invalid row"}`);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      failed: errors.length,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to import inventory CSV" }, { status: 400 });
  }
}
