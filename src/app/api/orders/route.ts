import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const {
      customer_name,
      customer_phone,
      customer_address,
      notes,
      items,
    }: {
      customer_name: string;
      customer_phone: string;
      customer_address: string;
      notes?: string;
      items: Array<{ product_id: string; quantity: number }>;
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Fetch current product prices and stock
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, name, price_usd, stock_qty, is_active")
      .in("id", productIds);

    if (prodError) throw prodError;

    // Validate stock
    for (const item of items) {
      const product = products?.find((p) => p.id === item.product_id);
      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found or inactive` },
          { status: 409 }
        );
      }
      if (product.stock_qty < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}": have ${product.stock_qty}, need ${item.quantity}`,
          },
          { status: 409 }
        );
      }
    }

    // Build sale items
    const saleItemsData = items.map((item) => {
      const product = products!.find((p) => p.id === item.product_id)!;
      return {
        product_id: item.product_id,
        product_name: product.name,
        unit_price_usd: product.price_usd,
        quantity: item.quantity,
        line_total_usd: product.price_usd * item.quantity,
      };
    });

    const subtotal = saleItemsData.reduce((s, i) => s + i.line_total_usd, 0);

    // Create sale record
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          channel: "online",
          customer_name,
          customer_phone,
          customer_address,
          notes: notes || null,
          subtotal_usd: subtotal,
          total_usd: subtotal,
        },
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    // Insert sale items (trigger deducts stock)
    const { data: insertedItems, error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItemsData.map((i) => ({ ...i, sale_id: sale.id })))
      .select();

    if (itemsError) {
      // Rollback sale if items failed (stock check trigger fires here)
      const { error: rollbackError } = await supabase
        .from("sales")
        .delete()
        .eq("id", sale.id);
      if (itemsError.message.includes("Insufficient stock")) {
        return NextResponse.json({ error: itemsError.message }, { status: 409 });
      }
      if (rollbackError) throw rollbackError;
      throw itemsError;
    }

    return NextResponse.json({
      sale_id: sale.id,
      total_usd: sale.total_usd,
      subtotal_usd: sale.subtotal_usd,
      items: insertedItems,
      invoice_url: null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
