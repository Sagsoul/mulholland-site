import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import { getDashboardStats, getProducts } from "@/lib/store";
import { formatUSD } from "@/lib/format";

export default async function AdminDashboardPage() {
  const [stats, recentProducts] = await Promise.all([
    getDashboardStats(),
    getProducts({ limit: 5 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Store overview and quick actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Products" value={stats.productCount} icon="📦" accent="navy" />
        <StatCard title="Sales" value={stats.saleCount} icon="🧾" accent="green" />
        <StatCard title="Revenue" value={formatUSD(stats.revenue)} icon="💵" accent="gold" />
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy">Recent Products</h2>
          <Link href="/admin/inventory" className="text-sm text-navy hover:text-gold font-medium">
            Manage inventory
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <p className="text-sm text-gray-500">No products yet. Add your first product in Inventory.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentProducts.map((product) => (
              <li key={product?.id} className="py-3 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">{product?.name}</span>
                <span className="text-gray-500">{formatUSD(product?.price ?? 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
