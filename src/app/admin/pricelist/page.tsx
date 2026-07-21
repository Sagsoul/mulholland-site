import { PricelistCategory } from "@/types";
import PriceListEditor from "@/components/admin/PriceListEditor";
import { getPriceList as fetchPriceList } from "@/lib/store";

export const metadata = { title: "Price List Editor" };
export const dynamic = "force-dynamic";

async function getPriceList(): Promise<PricelistCategory[]> {
  return fetchPriceList();
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
