import { Product } from "@/types";
import { formatUSD } from "@/lib/format";
import Link from "next/link";
import { getProducts } from "@/lib/store";

export const metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

async function getData() {
  return {
    products: getProducts({ includeInactive: true }) as Product[],
  };
}

export default async function InventoryPage() {
  const { products } = await getData();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Inventory</h1>
        <Link href="/admin/inventory/new" className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors">
          + Add Product
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-center px-4 py-3">Stock</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <tr key={product.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{product.name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{product.sku ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{(product.category as any)?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right font-bold text-navy">{formatUSD(product.price_usd)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${product.stock_qty === 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                    {product.stock_qty}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link href={`/admin/inventory/${product.id}`}
                    className="text-navy hover:text-gold text-xs font-medium">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">No products yet. Add your first product.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
