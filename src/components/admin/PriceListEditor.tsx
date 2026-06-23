"use client";

import { useState } from "react";
import { PricelistCategory, PricelistRow } from "@/types";
import { formatUSD } from "@/lib/format";

interface Props {
  initialCategories: PricelistCategory[];
}

export default function PriceListEditor({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const updateRow = (catId: string, rowId: string, field: keyof PricelistRow, value: string | number | null) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              pricelist_rows: (cat.pricelist_rows ?? []).map((row) =>
                row.id === rowId ? { ...row, [field]: value } : row
              ),
            }
          : cat
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/pricelist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Price list saved successfully!");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-navy text-lg">Edit Price List</h2>
        <div className="flex items-center gap-3">
          {message && <p className={`text-sm ${message.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>{message}</p>}
          <button onClick={handleSave} disabled={saving}
            className="bg-navy text-white px-6 py-2 rounded text-sm font-medium hover:bg-navy-light disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat.id} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-navy text-white px-4 py-2">
            <h3 className="font-bold">{cat.name}</h3>
            {cat.note && <p className="text-xs text-gray-300">{cat.note}</p>}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Part No.</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Size</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Unit</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Price (USD)</th>
              </tr>
            </thead>
            <tbody>
              {(cat.pricelist_rows ?? []).map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-3 py-1">
                    <input value={row.part_no ?? ""} onChange={(e) => updateRow(cat.id, row.id, "part_no", e.target.value || null)}
                      className="w-full text-xs border-b border-transparent hover:border-gray-300 focus:border-navy focus:outline-none py-0.5" />
                  </td>
                  <td className="px-3 py-1">
                    <input value={row.description} onChange={(e) => updateRow(cat.id, row.id, "description", e.target.value)}
                      className="w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-navy focus:outline-none py-0.5" />
                  </td>
                  <td className="px-3 py-1">
                    <input value={row.size ?? ""} onChange={(e) => updateRow(cat.id, row.id, "size", e.target.value || null)}
                      className="w-full text-xs border-b border-transparent hover:border-gray-300 focus:border-navy focus:outline-none py-0.5" />
                  </td>
                  <td className="px-3 py-1">
                    <input value={row.unit ?? ""} onChange={(e) => updateRow(cat.id, row.id, "unit", e.target.value || null)}
                      className="w-full text-xs border-b border-transparent hover:border-gray-300 focus:border-navy focus:outline-none py-0.5" />
                  </td>
                  <td className="px-3 py-1">
                    <input type="number" step="0.01" min="0"
                      value={row.price_usd ?? ""}
                      onChange={(e) => updateRow(cat.id, row.id, "price_usd", e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full text-sm text-right border-b border-transparent hover:border-gray-300 focus:border-navy focus:outline-none py-0.5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
