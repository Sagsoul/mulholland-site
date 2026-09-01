import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth-route";
import { deleteProduct, getProductById, updateProduct } from "@/lib/store";

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

  const body = await request.json();
  const updated = await updateProduct(context.params.id, {
    name: body.name,
    sku: body.sku,
    description: body.description,
    price: body.price === undefined && body.price_usd === undefined ? undefined : Number(body.price ?? body.price_usd),
    stock_qty: body.stock_qty === undefined ? undefined : Number(body.stock_qty),
    images: body.images,
    image_url: body.image_url,
    is_active: body.is_active,
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
