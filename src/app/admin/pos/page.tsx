import { Product } from "@/types";
import POSTerminal from "@/components/admin/POSTerminal";
import { getProducts as fetchProducts } from "@/lib/store";

export const metadata = { title: "POS Terminal" };
export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  return fetchProducts({ includeInactive: true }).sort((a, b) => a.name.localeCompare(b.name));
}

export default async function POSPage() {
  const products = await getProducts();
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">POS Terminal</h1>
      <POSTerminal products={products} />
    </div>
  );
}
