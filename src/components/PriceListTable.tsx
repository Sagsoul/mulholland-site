import { PricelistCategory } from "@/types";
import { formatUSD } from "@/lib/format";

interface Props {
  categories: PricelistCategory[];
}

export default function PriceListTable({ categories }: Props) {
  return (
    <div className="space-y-8">
      {categories.map((cat) => (
        <section key={cat.id}>
          <div className="bg-navy text-white px-4 py-2 rounded-t">
            <h2 className="font-bold text-base">{cat.name}</h2>
            {cat.note && <p className="text-xs text-gray-300 mt-0.5">{cat.note}</p>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-b border-gray-200">
              <thead className="bg-yellow-brand text-navy">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Part No.</th>
                  <th className="text-left px-3 py-2 font-semibold">Description</th>
                  <th className="text-left px-3 py-2 font-semibold">Size</th>
                  <th className="text-left px-3 py-2 font-semibold">Unit</th>
                  <th className="text-right px-3 py-2 font-semibold">Price (USD)</th>
                </tr>
              </thead>
              <tbody>
                {(cat.pricelist_rows ?? []).map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 text-gray-500 text-xs">{row.part_no ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-800">{row.description}</td>
                    <td className="px-3 py-2 text-gray-600">{row.size ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{row.unit ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-medium text-navy">
                      {row.price_usd != null ? formatUSD(row.price_usd) : "POA"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
