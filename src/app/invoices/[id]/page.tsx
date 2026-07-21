import { notFound } from "next/navigation";
import { getSale } from "@/lib/store";
import { COMPANY } from "@/lib/constants";
import { formatDateTime, formatUSD } from "@/lib/format";
import PrintInvoiceButton from "./PrintInvoiceButton";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const sale = getSale(params.id);
  return {
    title: sale ? `Invoice ${sale.invoice_number}` : "Invoice",
  };
}

export default function InvoicePage({ params }: Props) {
  const sale = getSale(params.id);
  if (!sale) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <p className="text-sm text-gray-500">Invoice</p>
          <h1 className="text-3xl font-bold text-navy">{sale.invoice_number}</h1>
        </div>
        <PrintInvoiceButton />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-bold text-navy mb-2">{COMPANY.name}</h2>
            <p className="text-sm text-gray-600 whitespace-pre-line">{COMPANY.address}</p>
            <p className="text-sm text-gray-600 mt-2">WhatsApp: {COMPANY.whatsapp}</p>
            <p className="text-sm text-gray-600">Email: {COMPANY.email}</p>
            <p className="text-sm text-gray-600">VAT: {COMPANY.vat}</p>
          </div>

          <div className="md:text-right">
            <p className="text-sm text-gray-500">Invoice Number</p>
            <p className="font-semibold text-navy">{sale.invoice_number}</p>
            <p className="text-sm text-gray-500 mt-3">Issued</p>
            <p className="text-sm text-gray-700">{formatDateTime(sale.created_at)}</p>
            <p className="text-sm text-gray-500 mt-3">Channel</p>
            <p className="text-sm text-gray-700 uppercase">{sale.channel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-navy mb-2">Buyer</h3>
            <p className="text-sm text-gray-700">{sale.customer_name ?? "Walk-in / not provided"}</p>
            <p className="text-sm text-gray-700">{sale.customer_phone ?? "No contact provided"}</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{sale.customer_address ?? "No address provided"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-navy mb-2">Notes</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{sale.notes ?? "No notes"}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-right px-4 py-3">Qty</th>
                <th className="text-right px-4 py-3">Unit</th>
                <th className="text-right px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {(sale.sale_items ?? []).map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-gray-700">{item.product_name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatUSD(item.unit_price_usd)}</td>
                  <td className="px-4 py-3 text-right font-medium text-navy">{formatUSD(item.line_total_usd)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={3} className="px-4 py-4 text-right font-semibold text-navy">
                  Total
                </td>
                <td className="px-4 py-4 text-right text-lg font-bold text-navy">
                  {formatUSD(sale.total_usd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
