import { createClient } from "@/lib/supabase/server";
import { Product } from "@/types";
import { formatUSD } from "@/lib/format";
import { notFound } from "next/navigation";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";
import { COMPANY } from "@/lib/constants";

async function getProduct(id: string): Promise<Product | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("id", id)
      .single();
    return data as Product | null;
  } catch {
    return null;
  }
}

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const product = await getProduct(params.id);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative h-80 md:h-96 bg-gray-100 rounded-xl overflow-hidden">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {product.is_second_hand && (
            <span className="absolute top-3 left-3 bg-gold text-navy text-sm font-bold px-3 py-1 rounded-full">
              Second Hand
            </span>
          )}
        </div>

        {/* Details */}
        <div>
          {product.sku && <p className="text-sm text-gray-400 mb-1">SKU: {product.sku}</p>}
          <h1 className="text-2xl font-bold text-navy mb-2">{product.name}</h1>
          {product.category && (
            <p className="text-sm text-gray-500 mb-4">{(product.category as any).name}</p>
          )}
          <p className="text-3xl font-bold text-navy mb-4">{formatUSD(product.price_usd)}</p>

          {product.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
          )}

          {product.stock_qty > 0 ? (
            <>
              <p className="text-sm text-green-600 font-medium mb-4">
                ✓ {product.is_second_hand ? "1 available" : `${product.stock_qty} in stock`}
              </p>
              <AddToCartButton product={product} />
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              This item is out of stock.
            </div>
          )}

          {/* WhatsApp enquiry */}
          <a
            href={`https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in: ${product.name} (${formatUSD(product.price_usd)})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 text-sm text-green-700 hover:text-green-800"
          >
            💬 Enquire via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
