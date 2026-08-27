import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth-route";
import { createProduct, getProducts } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const activeParam = request.nextUrl.searchParams.get("active");
    const isActive = activeParam === null ? undefined : activeParam === "true";

    const products = await getProducts({ search, isActive });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rawPrice = body.price ?? body.price_usd;
    if (rawPrice === undefined || rawPrice === null || rawPrice === "") {
      return NextResponse.json({ error: "Product price is required" }, { status: 400 });
    }

    const product = await createProduct({
      name: body.name,
      sku: body.sku,
      description: body.description,
      price: Number(rawPrice),
      stock_qty: Number(body.stock_qty ?? 0),
      image_url: body.image_url,
      is_active: body.is_active,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create product" }, { status: 400 });
  }
}
