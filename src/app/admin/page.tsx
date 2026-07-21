import StatCard from "@/components/admin/StatCard";
import { formatUSD } from "@/lib/format";
import { getDashboardStats as fetchDashboardStats } from "@/lib/store";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

async function getDashboardStats() {
  return fetchDashboardStats();
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Active Products" value={stats.activeProducts} icon="📦" accent="navy" />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon="⚠️" accent="red" />
        <StatCard title="Online Sales" value={stats.onlineSales} icon="🌐" accent="navy" />
        <StatCard title="POS Sales" value={stats.posSales} icon="🏪" accent="green" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-bold text-navy text-lg mb-4">Recent Sales</h2>
        {stats.recentSales.length === 0 ? (
          <p className="text-gray-400 text-sm">No sales yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-2 text-gray-500 font-medium">ID</th>
                <th className="text-left py-2 text-gray-500 font-medium">Channel</th>
                <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSales.map((sale: any) => (
                <tr key={sale.id} className="border-b border-gray-50">
                  <td className="py-2 font-mono text-xs text-gray-400">{(sale.id ?? "").slice(0, 8).toUpperCase()}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sale.channel === "online" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {sale.channel}
                    </span>
                  </td>
                  <td className="py-2 text-right font-bold text-navy">{formatUSD(sale.total_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
