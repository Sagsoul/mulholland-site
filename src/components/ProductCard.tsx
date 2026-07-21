"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { formatUSD } from "@/lib/format";
import { useCart } from "@/context/CartContext";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.product.id === product.id);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="block relative h-48 bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.is_second_hand && (
          <span className="absolute top-2 left-2 bg-gold text-navy text-xs font-bold px-2 py-0.5 rounded">
            Second Hand
          </span>
        )}
        {product.stock_qty === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded">SOLD</span>
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        {product.sku && (
          <p className="text-xs text-gray-400 mb-1">{product.sku}</p>
        )}
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm hover:text-navy transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-navy font-bold text-lg mt-2">{formatUSD(product.price_usd)}</p>
        <p className={`text-xs mt-1 ${product.stock_qty === 1 ? "text-orange-600 font-semibold" : "text-gray-500"}`}>
          {product.stock_qty === 1 ? "1 left" : `${product.stock_qty} in stock`}
        </p>

        <div className="mt-auto pt-3">
          {product.stock_qty > 0 ? (
            <button
              onClick={() => addItem(product)}
              disabled={inCart && product.is_second_hand}
              className="w-full bg-navy text-white py-2 rounded text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inCart ? "In Cart ✓" : "Add to Cart"}
            </button>
          ) : (
            <button disabled className="w-full bg-gray-200 text-gray-400 py-2 rounded text-sm font-medium cursor-not-allowed">
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
