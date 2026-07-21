import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth";
import { createSale } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      customer_name,
      notes,
      items,
    }: {
      customer_name?: string;
      notes?: string;
      items: Array<{ product_id: string; quantity: number }>;
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const sale = createSale({
      channel: "pos",
      customer_name,
      notes,
      items,
      created_by: "admin",
    });

    return NextResponse.json({
      sale_id: sale.id,
      total_usd: sale.total_usd,
      items: sale.sale_items ?? [],
      invoice_url: `/invoices/${sale.id}`,
    });
  } catch (error: any) {
    if (error.message?.includes("Insufficient stock") || error.message?.includes("inactive")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
