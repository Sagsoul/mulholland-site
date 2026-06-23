import { Sale } from "@/types";
import { formatUSD, formatDateTime } from "@/lib/format";

interface Props {
  sales: Sale[];
}

export default function SalesTable({ sales }: Props) {
  if (sales.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">No sales recorded yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-navy text-white">
          <tr>
            <th className="text-left px-4 py-3">Sale ID</th>
            <th className="text-left px-4 py-3">Channel</th>
            <th className="text-left px-4 py-3">Customer</th>
            <th className="text-left px-4 py-3">Date</th>
            <th className="text-right px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale, idx) => (
            <tr key={sale.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-4 py-2 font-mono text-xs text-gray-500">{sale.id.slice(0, 8).toUpperCase()}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${sale.channel === "online" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  {sale.channel}
                </span>
              </td>
              <td className="px-4 py-2 text-gray-700">{sale.customer_name ?? "—"}</td>
              <td className="px-4 py-2 text-gray-500">{formatDateTime(sale.created_at)}</td>
              <td className="px-4 py-2 text-right font-bold text-navy">{formatUSD(sale.total_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
