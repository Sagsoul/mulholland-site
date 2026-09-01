import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/store";
import { formatUSD } from "@/lib/format";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "./AddToCartButton";
import BuyViaWhatsApp from "./BuyViaWhatsApp";

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

  if (!product || !product.is_active) {
    notFound();
  }

  const images = product.images ?? [];
  const mainImage = images[0]?.image_path ?? null;
  const outOfStock = product.stock_qty === 0;
  const lowStock = !outOfStock && product.stock_qty <= 5;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/shop" className="text-sm text-navy hover:text-gold font-medium mb-6 inline-block">
            ← Back to Shop
          </Link>

          <div className="bg-white rounded-xl shadow p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Images */}
              <div>
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                  {mainImage ? (
                    <Image
                      src={mainImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 text-7xl">📦</div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {images.map((img, i) => (
                      <div key={img.id} className="relative w-16 h-16 rounded border-2 border-gray-200 overflow-hidden bg-gray-100">
                        <Image
                          src={img.image_path}
                          alt={`${product.name} image ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col justify-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-navy">{product.name}</h1>
                  {product.sku && (
                    <p className="text-xs text-gray-400 font-mono mt-1">SKU: {product.sku}</p>
                  )}
                </div>

                <div className="text-3xl font-bold text-navy">{formatUSD(product.price_usd)}</div>

                {/* Stock status */}
                <div>
                  {outOfStock ? (
                    <span className="inline-block bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-medium">
                      Out of Stock
                    </span>
                  ) : lowStock ? (
                    <span className="inline-block bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full font-medium">
                      Only {product.stock_qty} left
                    </span>
                  ) : (
                    <span className="inline-block bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
                      In Stock
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                )}

                {!outOfStock && (
                  <div className="flex flex-col gap-3 mt-2">
                    <AddToCartButton product={product} />
                    <BuyViaWhatsApp product={product} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
