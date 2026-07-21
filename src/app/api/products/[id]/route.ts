import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, getProduct, updateProduct } from "@/lib/store";
import { requireAdminApiSession } from "@/lib/admin-auth";

interface Params { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const product = getProduct(params.id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const product = updateProduct(params.id, body);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const deleted = deleteProduct(params.id);
    if (!deleted) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
