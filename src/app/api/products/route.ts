import { NextRequest, NextResponse } from "next/server";
import { createProduct, getProducts, getCategories } from "@/lib/store";
import { requireAdminApiSession } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const includeInactive = searchParams.get("all") === "1" && Boolean(requireAdminApiSession(request));
    const meta = searchParams.get("_meta");

    if (meta === "categories") {
      return NextResponse.json(getCategories());
    }

    return NextResponse.json(
      getProducts({
        includeInactive,
        categorySlug: category,
        q,
      })
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const product = createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
