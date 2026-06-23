import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/admin/StatCard";
import { formatUSD } from "@/lib/format";

export const metadata = { title: "Dashboard" };

async function getDashboardStats() {
  const supabase = createClient();

  const [productsRes, salesRes, lowStockRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact" }).eq("is_active", true).gt("stock_qty", 0),
    supabase.from("sales").select("total_usd, channel, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("products").select("id", { count: "exact" }).eq("is_active", true).eq("stock_qty", 0),
  ]);

  const activeProducts = productsRes.count ?? 0;
  const outOfStock = lowStockRes.count ?? 0;
  const sales = salesRes.data ?? [];
  const totalRevenue = sales.reduce((s: number, sale: any) => s + (sale.total_usd ?? 0), 0);
  const onlineSales = sales.filter((s: any) => s.channel === "online").length;
  const posSales = sales.filter((s: any) => s.channel === "pos").length;

  return { activeProducts, outOfStock, totalRevenue, onlineSales, posSales, recentSales: sales.slice(0, 5) };
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
