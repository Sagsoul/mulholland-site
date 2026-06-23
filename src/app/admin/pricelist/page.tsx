import { createClient } from "@/lib/supabase/server";
import { PricelistCategory } from "@/types";
import PriceListEditor from "@/components/admin/PriceListEditor";

export const metadata = { title: "Price List Editor" };

async function getPriceList(): Promise<PricelistCategory[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("pricelist_categories")
    .select("*, pricelist_rows(*)")
    .order("sort_order");

  if (!data) return [];
  return data.map((cat: any) => ({
    ...cat,
    pricelist_rows: (cat.pricelist_rows ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  })) as PricelistCategory[];
}

export default async function AdminPriceListPage() {
  const categories = await getPriceList();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Price List Editor</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <PriceListEditor initialCategories={categories} />
      </div>
    </div>
  );
}
