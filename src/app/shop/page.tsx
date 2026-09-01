import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/store";
import { formatUSD } from "@/lib/format";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const revalidate = 60;

export default async function ShopPage() {
  const products = await getProducts({ isActive: true });
  const inStock = products.filter((p) => p.stock_qty > 0);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-navy mb-2">Our Products</h1>
          <p className="text-gray-500 mb-8">Browse our available inventory.</p>

          {inStock.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-xl font-medium">No products available right now.</p>
              <p className="text-sm mt-2">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {inStock.map((product) => {
                const thumb = product.images?.[0]?.image_path ?? null;
                const lowStock = product.stock_qty > 0 && product.stock_qty <= 5;

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    <div className="relative w-full aspect-square bg-gray-100">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300 text-5xl">
                          📦
                        </div>
                      )}
                      {lowStock && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Only {product.stock_qty} left
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-navy truncate">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-navy">{formatUSD(product.price_usd)}</span>
                        <span className="text-xs text-green-600 font-medium">In Stock</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
