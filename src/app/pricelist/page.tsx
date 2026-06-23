import { createClient } from "@/lib/supabase/server";
import PriceListTable from "@/components/PriceListTable";
import { PricelistCategory } from "@/types";
import { COMPANY } from "@/lib/constants";
import Image from "next/image";

export const metadata = { title: "Retail Price List" };
export const revalidate = 300;

async function getPriceList(): Promise<PricelistCategory[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("pricelist_categories")
      .select("*, pricelist_rows(*)")
      .order("sort_order");

    if (!data) return [];
    return data.map((cat: any) => ({
      ...cat,
      pricelist_rows: (cat.pricelist_rows ?? []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order
      ),
    })) as PricelistCategory[];
  } catch {
    return [];
  }
}

export default async function PriceListPage() {
  const categories = await getPriceList();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="bg-navy text-white rounded-2xl p-8 mb-10 flex flex-col md:flex-row items-center gap-6">
        <Image src="/logo.svg" alt={COMPANY.name} width={160} height={48} />
        <div>
          <h1 className="text-2xl font-bold text-gold">Retail Price List</h1>
          <p className="text-gray-300 text-sm mt-1">{COMPANY.tagline}</p>
          <p className="text-gray-400 text-xs mt-1">All prices in USD · Subject to change without notice</p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>Price list is being updated. Please check back soon or contact us directly.</p>
        </div>
      ) : (
        <PriceListTable categories={categories} />
      )}

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-600">
        <strong>Note:</strong> Prices are in USD and subject to change. Contact us for wholesale pricing, bulk orders or colour-matching surcharges.
        <br />
        📞 {COMPANY.phones.business} · ✉️ {COMPANY.email}
      </div>
    </div>
  );
}
