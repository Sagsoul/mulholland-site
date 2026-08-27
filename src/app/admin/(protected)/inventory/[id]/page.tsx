import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUSD } from "@/lib/format";
import { getProductById } from "@/lib/store";

export default async function InventoryProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link href="/admin/inventory" className="text-sm text-navy hover:text-gold font-medium">
        ← Back to inventory
      </Link>
      <div className="bg-white rounded-lg shadow p-5 space-y-2">
        <h1 className="text-xl font-bold text-navy">{product.name}</h1>
        <p className="text-sm text-gray-500">SKU: {product.sku ?? "—"}</p>
        <p className="text-sm text-gray-700">{product.description ?? "No description"}</p>
        <p className="text-sm text-gray-700">Price: {formatUSD(product.price)}</p>
        <p className="text-sm text-gray-700">Stock: {product.stock_qty}</p>
        <p className="text-sm text-gray-700">Status: {product.is_active ? "Active" : "Inactive"}</p>
      </div>
    </div>
  );
}
