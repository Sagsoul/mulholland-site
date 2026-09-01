import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth-route";
import { createProduct, getProducts } from "@/lib/store";
import { saveProductImages, extractImageFiles, MAX_IMAGES } from "@/lib/upload";

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

    const formData = await request.formData();

    const name = formData.get("name");
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const rawPrice = formData.get("price");
    if (rawPrice === null || rawPrice === "") {
      return NextResponse.json({ error: "Product price is required" }, { status: 400 });
    }

    const imageFiles = extractImageFiles(formData);
    if (imageFiles.length > MAX_IMAGES) {
      return NextResponse.json({ error: `A product can have at most ${MAX_IMAGES} images` }, { status: 400 });
    }

    const productId = uuidv4();
    const imagePaths = imageFiles.length > 0 ? await saveProductImages(imageFiles, productId) : [];

    const isActiveValue = formData.get("is_active");
    const product = await createProduct({
      id: productId,
      name: name.trim(),
      description: formData.get("description") as string | null,
      price: Number(rawPrice),
      stock_qty: Number(formData.get("stock_qty") ?? 0),
      images: imagePaths,
      is_active: isActiveValue === null ? true : isActiveValue !== "false" && isActiveValue !== "0",
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create product" }, { status: 400 });
  }
}
