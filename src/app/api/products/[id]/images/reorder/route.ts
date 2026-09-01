import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth-route";
import { getProductById, reorderProductImages } from "@/lib/store";

interface Context {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await getProductById(context.params.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    if (!Array.isArray(body.image_ids) || body.image_ids.some((id: unknown) => typeof id !== "string")) {
      return NextResponse.json({ error: "image_ids must be an array of strings" }, { status: 400 });
    }

    await reorderProductImages(context.params.id, body.image_ids);
    const updated = await getProductById(context.params.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to reorder images" }, { status: 500 });
  }
}
