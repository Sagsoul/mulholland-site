import Link from "next/link";
import { notFound } from "next/navigation";
import { getSaleById } from "@/lib/store";
import { formatUSD, formatDateTime } from "@/lib/format";
import PrintInvoiceButton from "./PrintInvoiceButton";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const sale = await getSaleById(params.id);

  if (!sale) {
    notFound();
  }

  const items = sale.items ?? [];

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">
        {/* Actions - hidden on print */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/admin/sales" className="text-sm text-navy hover:text-gold font-medium">
            ← Back to Sales
          </Link>
          <div className="flex gap-3">
            <PrintInvoiceButton />
          </div>
        </div>

        {/* Invoice */}
        <div className="bg-white rounded-xl shadow p-8 print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-navy">Mulholland Traders Pvt Ltd</h1>
              <p className="text-sm text-gray-500 mt-1">Zimbabwe</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-navy">{sale.invoice_number}</p>
              <p className="text-sm text-gray-500">{formatDateTime(sale.created_at)}</p>
            </div>
          </div>

          {/* Customer details */}
          {(sale.customer_name || sale.customer_email || sale.customer_phone || sale.customer_address) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg print:bg-white print:border print:border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Bill To</h2>
              {sale.customer_name && <p className="font-semibold text-gray-800">{sale.customer_name}</p>}
              {sale.customer_phone && <p className="text-sm text-gray-600">{sale.customer_phone}</p>}
              {sale.customer_email && <p className="text-sm text-gray-600">{sale.customer_email}</p>}
              {sale.customer_address && <p className="text-sm text-gray-600">{sale.customer_address}</p>}
            </div>
          )}

          {/* Items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-gray-600 font-semibold">Product</th>
                <th className="text-right py-2 text-gray-600 font-semibold">Qty</th>
                <th className="text-right py-2 text-gray-600 font-semibold">Unit Price</th>
                <th className="text-right py-2 text-gray-600 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2">{item.product_name ?? "Unknown Product"}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">{formatUSD(item.unit_price_usd)}</td>
                  <td className="py-2 text-right">{formatUSD(item.line_total_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t-2 border-gray-200 pt-4 space-y-1 ml-auto max-w-xs">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatUSD(sale.subtotal_usd)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span>-{formatUSD(sale.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-navy border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>{formatUSD(sale.total_usd)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Payment method:</span>{" "}
              <span className="capitalize">{sale.payment_method.replace("_", " ")}</span>
            </p>
            {sale.notes && (
              <p><span className="font-medium">Notes:</span> {sale.notes}</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
            Thank you for your purchase from Mulholland Traders Pvt Ltd.
          </div>
        </div>
      </div>
    </div>
  );
}
