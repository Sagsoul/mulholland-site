import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { PricelistCategory } from "@/types";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("pricelist_categories")
      .select("*, pricelist_rows(*)")
      .order("sort_order");

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { categories }: { categories: PricelistCategory[] } = await request.json();

    // Upsert rows for each category
    for (const cat of categories) {
      const rows = cat.pricelist_rows ?? [];
      if (rows.length > 0) {
        const { error } = await supabase.from("pricelist_rows").upsert(
          rows.map((row) => ({
            id: row.id,
            category_id: cat.id,
            part_no: row.part_no,
            description: row.description,
            size: row.size,
            unit: row.unit,
            price_usd: row.price_usd,
            sort_order: row.sort_order,
          }))
        );
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
