import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth-route";
import { createSale, getSales } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sales = await getSales();
    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const sale = await createSale({
      channel: body.channel,
      customer_name: body.customer_name,
      items: body.items,
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create sale" }, { status: 400 });
  }
}
