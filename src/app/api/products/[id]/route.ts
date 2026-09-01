import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth-route";
import { deleteProduct, getProductById, updateProduct } from "@/lib/store";
import { saveProductImages, extractImageFiles, MAX_IMAGES } from "@/lib/upload";

interface Context {
  params: {
    id: string;
  };
}

export async function GET(_: NextRequest, context: Context) {
  try {
    const product = await getProductById(context.params.id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to fetch product" }, { status: 500 });
  }
}

async function handleUpdate(request: NextRequest, context: Context) {
  if (!requireAdminApiSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let name: string | undefined;
  let description: string | null | undefined;
  let price: number | undefined;
  let stockQty: number | undefined;
  let isActive: boolean | undefined;
  let imagePaths: string[] | undefined;

  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();

    const nameValue = formData.get("name");
    if (nameValue !== null) {
      name = typeof nameValue === "string" ? nameValue : undefined;
    }

    const descValue = formData.get("description");
    if (descValue !== null) {
      description = typeof descValue === "string" ? descValue || null : null;
    }

    const priceValue = formData.get("price");
    if (priceValue !== null) {
      price = Number(priceValue);
    }

    const stockValue = formData.get("stock_qty");
    if (stockValue !== null) {
      stockQty = Number(stockValue);
    }

    const activeValue = formData.get("is_active");
    if (activeValue !== null) {
      isActive = activeValue !== "false" && activeValue !== "0";
    }

    const imageFiles = extractImageFiles(formData);
    if (imageFiles.length > MAX_IMAGES) {
      return NextResponse.json({ error: `A product can have at most ${MAX_IMAGES} images` }, { status: 400 });
    }

    if (imageFiles.length > 0) {
      imagePaths = await saveProductImages(imageFiles, context.params.id);
    }
  } else {
    const body = await request.json();
    name = body.name;
    description = body.description;
    price = body.price === undefined && body.price_usd === undefined ? undefined : Number(body.price ?? body.price_usd);
    stockQty = body.stock_qty === undefined ? undefined : Number(body.stock_qty);
    isActive = body.is_active;
    imagePaths = body.images;
  }

  const updated = await updateProduct(context.params.id, {
    name,
    description,
    price,
    stock_qty: stockQty,
    images: imagePaths,
    is_active: isActive,
  });

  if (!updated) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    return await handleUpdate(request, context);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to update product" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    return await handleUpdate(request, context);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to update product" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await deleteProduct(context.params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to delete product" }, { status: 500 });
  }
}
