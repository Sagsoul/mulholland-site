import { formatDateTime, formatUSD } from "@/lib/format";
import { getSales } from "@/lib/store";

export default async function AdminSalesPage() {
  const sales = await getSales();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Sales History</h1>
        <p className="text-sm text-gray-500 mt-1">All recorded invoices.</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {sales.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">No sales recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="text-left px-4 py-3">Invoice</th>
                  <th className="text-left px-4 py-3">Channel</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr key={sale.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2 font-medium">{sale.invoice_number}</td>
                    <td className="px-4 py-2">{sale.channel}</td>
                    <td className="px-4 py-2 text-gray-700">{sale.customer_name || "—"}</td>
                    <td className="px-4 py-2 text-gray-500">{formatDateTime(sale.created_at)}</td>
                    <td className="px-4 py-2 text-right font-bold text-navy">{formatUSD(sale.total_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
