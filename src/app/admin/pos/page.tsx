import { createClient } from "@/lib/supabase/server";
import { Product } from "@/types";
import POSTerminal from "@/components/admin/POSTerminal";

export const metadata = { title: "POS Terminal" };

async function getProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .order("name");
  return (data as Product[]) ?? [];
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
