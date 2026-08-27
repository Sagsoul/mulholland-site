"use client";

import { useEffect, useState } from "react";
import { formatUSD } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
};

export default function AdminPricelistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function loadProducts() {
    const response = await fetch("/api/products", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to fetch products");
    }
    setProducts(data.map((product: any) => ({ ...product, price: Number(product.price) })));
  }

  useEffect(() => {
    void loadProducts().catch((error: any) => setMessage(error.message ?? "Failed to fetch products"));
  }, []);

  async function updatePrice(id: string, price: number) {
    setSavingId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update price");
      }

      setProducts((current) => current.map((product) => (product.id === id ? { ...product, price: data.price } : product)));
      setMessage("Price list updated.");
    } catch (error: any) {
      setMessage(error.message ?? "Failed to update price");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Price List</h1>
        <p className="text-sm text-gray-500 mt-1">Manage current product pricing.</p>
      </div>

      {message && <p className="text-sm text-gray-700">{message}</p>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {products.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">No products available.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">SKU</th>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-right px-3 py-2">Current Price</th>
                <th className="text-right px-3 py-2">Update</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <PriceRow
                  key={product.id}
                  product={product}
                  disabled={savingId === product.id}
                  onSave={updatePrice}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PriceRow({
  product,
  disabled,
  onSave,
}: {
  product: Product;
  disabled: boolean;
  onSave: (id: string, price: number) => Promise<void>;
}) {
  const [price, setPrice] = useState(String(product.price));

  useEffect(() => {
    setPrice(String(product.price));
  }, [product.price]);

  return (
    <tr className="border-t border-gray-100">
      <td className="px-3 py-2 text-gray-500">{product.sku ?? "—"}</td>
      <td className="px-3 py-2">{product.name}</td>
      <td className="px-3 py-2 text-right">{formatUSD(product.price)}</td>
      <td className="px-3 py-2 text-right">
        <div className="inline-flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right"
          />
          <button
            disabled={disabled}
            onClick={() => void onSave(product.id, Number(price))}
            className="bg-navy text-white px-3 py-1 rounded text-xs disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}
