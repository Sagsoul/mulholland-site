"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Product, CartItem } from "@/types";
import { formatUSD } from "@/lib/format";

interface Props {
  products: Product[];
}

type DiscountType = "none" | "fixed" | "percent";
type PaymentMethod = "cash" | "card" | "mobile_money";

export default function POSTerminal({ products }: Props) {
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const didAutoAdd = useRef(false);
  const [search, setSearch] = useState("");

  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("");

  // Discount
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ message: string; invoiceUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

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

  useEffect(() => {
    if (didAutoAdd.current) return;
    const id = searchParams.get("id");
    if (!id) return;
    const product = products.find((p) => p.id === id);
    if (product && product.stock_qty > 0) {
      addToCart(product);
      didAutoAdd.current = true;
    }
  }, [products, searchParams]);

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

  const subtotal = cart.reduce((s, i) => s + i.product.price_usd * i.quantity, 0);

  const discountAmount = (() => {
    if (discountType === "none" || !discountValue) return 0;
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) return 0;
    if (discountType === "percent") return Math.min(subtotal * (val / 100), subtotal);
    return Math.min(val, subtotal);
  })();

  const total = Math.max(subtotal - discountAmount, 0);
  const change = paymentMethod === "cash" && amountTendered
    ? parseFloat(amountTendered) - total
    : null;

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
          customer_phone: customerPhone || null,
          customer_email: customerEmail || null,
          customer_address: customerAddress || null,
          payment_method: paymentMethod,
          discount_amount: discountAmount,
          discount_type: discountType === "none" ? "fixed" : discountType,
          notes: notes || null,
          items: cart.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sale failed");

      setSuccess({
        message: `Sale ${data.invoice_number} — ${formatUSD(data.total_usd)}`,
        invoiceUrl: data.invoice_url,
      });
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerAddress("");
      setPaymentMethod("cash");
      setAmountTendered("");
      setDiscountType("none");
      setDiscountValue("");
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3000);
      return;
    }
    setCart([]);
    setClearConfirm(false);
    setSuccess(null);
    setError(null);
  };

  function stockBadge(qty: number) {
    if (qty > 10) return <span className="text-xs text-green-600 font-medium">✓ {qty}</span>;
    if (qty > 4) return <span className="text-xs text-yellow-600 font-medium">⚠ {qty}</span>;
    return <span className="text-xs text-red-600 font-medium">Low: {qty}</span>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Product Panel ── */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col">
        <h2 className="font-bold text-navy mb-3">Products</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No products available</p>
          ) : (
            filtered.map((p) => {
              const thumb = p.images?.[0]?.image_path ?? null;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full text-left flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-navy hover:text-white transition-colors group"
                >
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    {thumb ? (
                      <Image src={thumb} alt={p.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-lg">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    {p.sku && <p className="text-xs text-gray-400 group-hover:text-gray-200">{p.sku}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">{formatUSD(p.price_usd)}</p>
                    <div className="group-hover:text-gray-200">{stockBadge(p.stock_qty)}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Cart Panel ── */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
        <h2 className="font-bold text-navy">Current Sale</h2>

        {/* Customer details */}
        <div className="grid grid-cols-2 gap-2">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name *"
            className="col-span-2 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Email (optional)"
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <textarea
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Address (optional)"
            rows={1}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
          />
        </div>

        {/* Cart items */}
        <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: "220px" }}>
          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No items added</p>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between border-b pb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{formatUSD(item.product.price_usd)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 border rounded text-sm flex items-center justify-center hover:bg-gray-100"
                  >−</button>
                  <span className="text-sm w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 border rounded text-sm flex items-center justify-center hover:bg-gray-100"
                  >+</button>
                  <span className="text-sm font-bold text-navy w-16 text-right">
                    {formatUSD(item.product.price_usd * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-400 hover:text-red-600 ml-1 text-sm"
                  >✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount */}
        <div className="flex gap-2 items-center">
          <select
            value={discountType}
            onChange={(e) => { setDiscountType(e.target.value as DiscountType); setDiscountValue(""); }}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
          >
            <option value="none">No Discount</option>
            <option value="fixed">Fixed ($)</option>
            <option value="percent">Percent (%)</option>
          </select>
          {discountType !== "none" && (
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percent" ? "%" : "$"}
              className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
            />
          )}
        </div>

        {/* Payment method */}
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-gray-700 shrink-0">Payment:</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile_money">Mobile Money (Ecocash/OneMoney)</option>
          </select>
        </div>

        {paymentMethod === "cash" && (
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-700 shrink-0">Amount Tendered:</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              placeholder="$0.00"
              className="w-28 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
            />
            {change !== null && change >= 0 && (
              <span className="text-sm font-bold text-green-700">Change: {formatUSD(change)}</span>
            )}
            {change !== null && change < 0 && (
              <span className="text-sm font-bold text-red-600">Short: {formatUSD(Math.abs(change))}</span>
            )}
          </div>
        )}

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
        />

        {/* Total breakdown */}
        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatUSD(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>
                Discount {discountType === "percent" ? `(${discountValue}%)` : ""}
              </span>
              <span>-{formatUSD(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-navy text-xl">
            <span>Total</span>
            <span>{formatUSD(total)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
            <p className="font-medium">✓ {success.message}</p>
            <div className="flex gap-4 mt-1">
              <Link
                href={success.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                View Invoice
              </Link>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSale}
            disabled={cart.length === 0 || submitting}
            className="flex-1 bg-gold text-navy py-3 rounded-lg font-bold text-lg hover:bg-gold/80 transition-colors disabled:opacity-50"
          >
            {submitting ? "Processing…" : "💰 Complete Sale"}
          </button>
          <button
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
              clearConfirm
                ? "bg-red-600 text-white border-red-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {clearConfirm ? "Confirm Clear" : "Clear"}
          </button>
        </div>
      </div>
    </div>
  );
}
