import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth-route";
import { deleteProductImage, getProductById } from "@/lib/store";

interface Context {
  params: {
    id: string;
    imageId: string;
  };
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await getProductById(context.params.id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const deleted = await deleteProductImage(context.params.imageId, context.params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to delete image" }, { status: 500 });
  }
}
