"use client";

import { useCart } from "@/context/CartContext";
import { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.product.id === product.id);

  return (
    <button
      onClick={() => addItem(product)}
      className="btn-primary w-full text-center text-base"
    >
      {inCart ? "✓ Added to Cart" : "Add to Cart"}
    </button>
  );
}
