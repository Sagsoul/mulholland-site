import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/store";
import { formatUSD } from "@/lib/format";

export const revalidate = 60;

export default async function Home() {
  const products = (await getProducts({ isActive: true })).filter((p) => p.stock_qty > 0).slice(0, 8);

  return (
    <div className="bg-gray-50">
      <section className="bg-navy text-white py-20 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Mulholland Traders Pvt Ltd</h1>
        <p className="text-lg text-gray-200 mb-8">Pipe repair, waterproofing &amp; hardware supplies.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/shop" className="bg-gold text-navy font-bold px-6 py-3 rounded-lg">
            Browse Shop
          </Link>
          <Link href="/admin/pos" className="border border-white text-white font-medium px-6 py-3 rounded-lg">
            POS Terminal
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold text-navy mb-6">Featured Products</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">No products available right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => {
              const thumb = product.images?.[0]?.image_path ?? null;
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="relative w-full aspect-square bg-gray-100">
                    {thumb ? (
                      <Image src={thumb} alt={product.name} fill className="object-cover" sizes="25vw" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-5xl">📦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-navy truncate">{product.name}</h3>
                    <p className="text-lg font-bold text-navy mt-2">{formatUSD(product.price_usd)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
