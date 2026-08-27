"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUSD } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  stock_qty: number;
  image_url: string | null;
  is_active: boolean;
};

type ProductFormState = {
  name: string;
  sku: string;
  description: string;
  price: string;
  stock_qty: string;
  image_url: string;
  is_active: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  sku: "",
  description: "",
  price: "0",
  stock_qty: "0",
  image_url: "",
  is_active: true,
};

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch products");
      }

      setProducts(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name,
        sku: form.sku || null,
        description: form.description || null,
        price: Number(form.price),
        stock_qty: Number(form.stock_qty),
        image_url: form.image_url || null,
        is_active: form.is_active,
      };

      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save product");
      }

      await loadProducts();
      setForm(emptyForm);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku ?? "",
      description: product.description ?? "",
      price: String(product.price),
      stock_qty: String(product.stock_qty),
      image_url: product.image_url ?? "",
      is_active: product.is_active,
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) {
      return;
    }

    setError("");
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Failed to delete product");
      return;
    }

    await loadProducts();
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">Create, edit, and delete products.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-navy mb-4">{isEditing ? "Edit Product" : "Add Product"}</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Stock Qty"
            value={form.stock_qty}
            onChange={(e) => setForm((prev) => ({ ...prev, stock_qty: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Image URL"
            value={form.image_url}
            onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
            rows={3}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Active product
          </label>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-navy text-white px-5 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Update Product" : "Create Product"}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="border border-gray-300 px-5 py-2 rounded text-sm"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-navy mb-4">Products</h2>

        {loading ? (
          <p className="text-sm text-gray-500">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500">No products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">SKU</th>
                  <th className="text-right px-3 py-2">Price</th>
                  <th className="text-right px-3 py-2">Stock</th>
                  <th className="text-center px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{product.name}</td>
                    <td className="px-3 py-2 text-gray-500">{product.sku ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{formatUSD(product.price)}</td>
                    <td className="px-3 py-2 text-right">{product.stock_qty}</td>
                    <td className="px-3 py-2 text-center">{product.is_active ? "Active" : "Inactive"}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button onClick={() => handleEdit(product)} className="text-navy text-xs font-medium">
                        Edit
                      </button>
                      <button onClick={() => void handleDelete(product.id)} className="text-red-600 text-xs font-medium">
                        Delete
                      </button>
                    </td>
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
