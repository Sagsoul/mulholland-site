import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatUSD } from "@/lib/format";
import { getProductById } from "@/lib/store";

export default async function InventoryProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  const images = product.images ?? [];

  return (
    <div className="space-y-4">
      <Link href="/admin/inventory" className="text-sm text-navy hover:text-gold font-medium">
        ← Back to inventory
      </Link>
      <div className="bg-white rounded-lg shadow p-5 space-y-3">
        <h1 className="text-xl font-bold text-navy">{product.name}</h1>
        <p className="text-xs text-gray-400 font-mono">SKU: {product.sku ?? "—"}</p>
        <p className="text-sm text-gray-700">{product.description ?? "No description"}</p>
        <p className="text-sm text-gray-700">Price: {formatUSD(product.price)}</p>
        <p className="text-sm text-gray-700">Stock: {product.stock_qty}</p>
        <p className="text-sm text-gray-700">Status: {product.is_active ? "Active" : "Inactive"}</p>

        {images.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Images ({images.length})</p>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={img.id} className="relative w-32 h-32 rounded border overflow-hidden bg-gray-100">
                  <Image
                    src={img.image_path}
                    alt={`${product.name} image ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
