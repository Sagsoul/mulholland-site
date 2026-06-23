"use client";

import { useState, useEffect } from "react";
import { Product, CartItem } from "@/types";
import { formatUSD } from "@/lib/format";
import { generateReceiptPDF } from "@/lib/pdf/receipt";

interface Props {
  products: Product[];
}

export default function POSTerminal({ products }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = products.filter(
    (p) =>
      p.stock_qty > 0 &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stock_qty) }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.min(qty, i.product.stock_qty) }
          : i
      )
    );
  };

  const total = cart.reduce((s, i) => s + i.product.price_usd * i.quantity, 0);

  const handleSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName || null,
          notes: notes || null,
          items: cart.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sale failed");

      // Generate receipt PDF
      const { blob, filename } = await generateReceiptPDF(
        data.sale_id,
        data.items,
        data.total_usd,
        "pos",
        customerName || undefined
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(`Sale #${data.sale_id.slice(0, 8).toUpperCase()} recorded — ${formatUSD(data.total_usd)}`);
      setCart([]);
      setCustomerName("");
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Product browser */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-bold text-navy mb-3">Products</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="w-full text-left flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-navy hover:text-white transition-colors group"
            >
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                {p.sku && <p className="text-xs text-gray-400 group-hover:text-gray-200">{p.sku}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatUSD(p.price_usd)}</p>
                <p className="text-xs text-gray-400 group-hover:text-gray-200">Qty: {p.stock_qty}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">No products found</p>
          )}
        </div>
      </div>

      {/* Cart / sale */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col">
        <h2 className="font-bold text-navy mb-3">Current Sale</h2>

        {/* Customer */}
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name (optional)"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
        />

        {/* Cart items */}
        <div className="flex-1 space-y-2 mb-4 max-h-64 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No items added</p>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{formatUSD(item.product.price_usd)} each</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button onClick={() => updateQty(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 border rounded text-sm flex items-center justify-center hover:bg-gray-100">−</button>
                  <span className="text-sm w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 border rounded text-sm flex items-center justify-center hover:bg-gray-100">+</button>
                  <span className="text-sm font-bold text-navy w-16 text-right">
                    {formatUSD(item.product.price_usd * item.quantity)}
                  </span>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
        />

        {/* Total */}
        <div className="flex justify-between items-center font-bold text-navy text-xl mb-3 border-t pt-3">
          <span>Total</span>
          <span>{formatUSD(total)}</span>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-3">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm mb-3">{success}</div>}

        <button
          onClick={handleSale}
          disabled={cart.length === 0 || submitting}
          className="w-full bg-gold text-navy py-3 rounded-lg font-bold text-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
        >
          {submitting ? "Processing…" : "💰 Complete Sale"}
        </button>
      </div>
    </div>
  );
}
