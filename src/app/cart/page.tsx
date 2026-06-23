"use client";

import { useCart } from "@/context/CartContext";
import { formatUSD } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, updateQty, totalUsd, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-navy mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some products to get started</p>
        <Link href="/shop" className="btn-primary inline-block">Browse Shop</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-navy mb-8">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="bg-white rounded-lg shadow p-4 flex gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                {item.product.image_url ? (
                  <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 text-xs">No img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.product.id}`}>
                  <h3 className="font-semibold text-gray-800 hover:text-navy">{item.product.name}</h3>
                </Link>
                {item.product.sku && <p className="text-xs text-gray-400">{item.product.sku}</p>}
                <p className="text-navy font-bold mt-1">{formatUSD(item.product.price_usd)}</p>
                <div className="flex items-center gap-3 mt-2">
                  {!item.product.is_second_hand ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100">−</button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100">+</button>
                    </div>
                  ) : (
                    <span className="text-xs text-gold font-medium">Qty: 1 (single item)</span>
                  )}
                  <button onClick={() => removeItem(item.product.id)}
                    className="text-sm text-red-400 hover:text-red-600 ml-auto">Remove</button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-navy">{formatUSD(item.product.price_usd * item.quantity)}</p>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            Clear cart
          </button>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="font-bold text-navy text-lg mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm text-gray-600">
                <span className="truncate mr-2">{item.product.name} × {item.quantity}</span>
                <span className="flex-shrink-0">{formatUSD(item.product.price_usd * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-navy text-lg mb-6">
            <span>Total</span>
            <span>{formatUSD(totalUsd)}</span>
          </div>
          <Link href="/checkout" className="btn-primary block text-center">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
