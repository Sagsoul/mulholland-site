import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth";
import { getPriceList, savePriceList } from "@/lib/store";
import { PricelistCategory } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(getPriceList());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { categories }: { categories: PricelistCategory[] } = await request.json();
    savePriceList(categories);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
