"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatUSD } from "@/lib/format";
import { generateProFormaInvoicePDF } from "@/lib/pdf/invoice";
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import Link from "next/link";
import { CheckoutFormData, OrderResponse } from "@/types";

export default function CheckoutPage() {
  const { items, totalUsd, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutFormData>({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderComplete, setOrderComplete] = useState<OrderResponse | null>(null);

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy mb-2">Nothing to checkout</h1>
        <p className="text-gray-500 mb-6">Your cart is empty</p>
        <Link href="/shop" className="btn-primary inline-block">Continue Shopping</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error ?? "One or more items are out of stock. Please refresh your cart.");
        } else {
          setError(data.error ?? "Failed to place order. Please try again.");
        }
        return;
      }

      // Generate and download PDF
      try {
        const { blob, filename } = await generateProFormaInvoicePDF(
          data.sale_id,
          items,
          form.customer_name,
          form.customer_phone,
          form.customer_address,
          form.notes || undefined
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // PDF generation failure shouldn't block the flow
      }

      setOrderComplete(data as OrderResponse);
      clearCart();
    } catch (err: any) {
      setError(err.message ?? "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderComplete) {
    const waMessage = buildWhatsAppOrderMessage(
      orderComplete.sale_id,
      items.length > 0 ? items : orderComplete.items.map((i) => ({
        product: { id: i.product_id, name: i.product_name, price_usd: i.unit_price_usd } as any,
        quantity: i.quantity,
      })),
      orderComplete.total_usd,
      form.customer_name,
      form.customer_phone,
      form.customer_address,
      form.notes || undefined,
      orderComplete.invoice_url
        ? `${window.location.origin}${orderComplete.invoice_url}`
        : undefined
    );
    const waUrl = buildWhatsAppUrl(waMessage);

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-navy mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-2">Order #{orderComplete.sale_id.slice(0, 8).toUpperCase()}</p>
        <p className="text-xl font-bold text-navy mb-6">Total: {formatUSD(orderComplete.total_usd)}</p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-left">
          <h2 className="font-bold text-navy mb-2">Next Steps</h2>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
            <li>Your pro-forma invoice has been downloaded automatically.</li>
            <li>Click the WhatsApp button below to send your order confirmation.</li>
            <li>Attach your invoice PDF to the WhatsApp message.</li>
            <li>We&apos;ll confirm availability and arrange payment.</li>
          </ol>
        </div>

        {orderComplete.invoice_url && (
          <div className="mb-6">
            <Link href={orderComplete.invoice_url} target="_blank" className="text-navy hover:text-gold font-medium">
              View printable invoice →
            </Link>
          </div>
        )}

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold inline-flex items-center gap-2 text-lg px-8 py-4 mb-4"
        >
          💬 Send via WhatsApp
        </a>

        <p className="text-xs text-gray-400 mb-6">
          Opens WhatsApp with your order details pre-filled. Remember to attach the invoice PDF.
        </p>

        <Link href="/shop" className="text-navy hover:text-gold font-medium">
          ← Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-navy mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="input" placeholder="John Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input required value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                className="input" placeholder="+263 77 xxx xxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
              <textarea required rows={3} value={form.customer_address}
                onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                className="input" placeholder="Your delivery address…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input" placeholder="Any special instructions…" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-gold w-full text-center text-base py-3">
              {submitting ? "Processing…" : "🧾 Place Order & Download Invoice"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Placing your order generates a pro-forma invoice and opens WhatsApp for confirmation.
              Payment terms: Cash with Order.
            </p>
          </form>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="font-bold text-navy text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{item.product.name}</p>
                  <p className="text-gray-400 text-xs">{item.product.sku}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-navy">{formatUSD(item.product.price_usd * item.quantity)}</p>
                  <p className="text-gray-400 text-xs">× {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-navy text-xl">
            <span>Total (USD)</span>
            <span>{formatUSD(totalUsd)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Terms: Cash with Order</p>
        </div>
      </div>
    </div>
  );
}
