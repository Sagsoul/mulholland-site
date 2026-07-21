"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/types";
import { buildProductWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export default function BuyViaWhatsApp({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [productUrl, setProductUrl] = useState("");
  const maxQuantity = Math.max(1, product.stock_qty);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProductUrl(window.location.href);
    }
  }, []);

  const href = useMemo(() => {
    if (!productUrl) {
      return "#";
    }

    return buildWhatsAppUrl(
      buildProductWhatsAppMessage({
        productName: product.name,
        quantity,
        unitPriceUsd: product.price_usd,
        productUrl,
      })
    );
  }, [product.name, product.price_usd, productUrl, quantity]);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="whatsapp-quantity" className="text-sm font-medium text-gray-700">
          Qty
        </label>
        <input
          id="whatsapp-quantity"
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            setQuantity(Number.isNaN(nextValue) ? 1 : Math.min(maxQuantity, Math.max(1, nextValue)));
          }}
          className="w-24 border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!productUrl}
        className="inline-flex items-center justify-center gap-2 w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
        onClick={(event) => {
          if (!productUrl) {
            event.preventDefault();
          }
        }}
      >
        💬 Buy via WhatsApp
      </a>
    </div>
  );
}
