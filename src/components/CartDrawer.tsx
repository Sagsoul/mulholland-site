"use client";

import { useCart } from "@/context/CartContext";
import { formatUSD } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQty, totalUsd } = useCart();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg text-navy">Your Cart ({items.length})</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                    {item.product.image_url ? (
                      <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-navy font-bold">{formatUSD(item.product.price_usd)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {!item.product.is_second_hand && (
                        <>
                          <button
                            onClick={() => updateQty(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100"
                          >−</button>
                          <span className="text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100"
                          >+</button>
                        </>
                      )}
                      {item.product.is_second_hand && (
                        <span className="text-xs text-gold">Qty: 1</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="text-gray-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between font-bold text-navy text-lg">
                <span>Total</span>
                <span>{formatUSD(totalUsd)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full bg-navy text-white text-center py-3 rounded-lg font-medium hover:bg-navy-light transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
