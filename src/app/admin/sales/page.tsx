import { createClient } from "@/lib/supabase/server";
import { Sale } from "@/types";
import SalesTable from "@/components/admin/SalesTable";
import { formatUSD } from "@/lib/format";

export const metadata = { title: "Sales" };

async function getSales(): Promise<Sale[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as Sale[]) ?? [];
}

export default async function SalesPage() {
  const sales = await getSales();
  const totalRevenue = sales.reduce((s, sale) => s + sale.total_usd, 0);
  const onlineCount = sales.filter((s) => s.channel === "online").length;
  const posCount = sales.filter((s) => s.channel === "pos").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Sales History</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-navy">{formatUSD(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Online Orders</p>
          <p className="text-2xl font-bold text-blue-600">{onlineCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">POS Sales</p>
          <p className="text-2xl font-bold text-green-600">{posCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <SalesTable sales={sales} />
      </div>
    </div>
  );
}
