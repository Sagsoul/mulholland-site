"use client";

import { useState, useEffect } from "react";
import { Product, Category } from "@/types";

interface Props {
  product?: Product;
  categories: Category[];
  onSave: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({ product, categories, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
    price_usd: product?.price_usd?.toString() ?? "",
    stock_qty: product?.stock_qty?.toString() ?? "1",
    is_second_hand: product?.is_second_hand ?? true,
    image_url: product?.image_url ?? "",
    is_active: product?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        price_usd: parseFloat(form.price_usd),
        stock_qty: parseInt(form.stock_qty, 10),
      });
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setForm((current) => ({ ...current, image_url: data.url ?? "" }));
    } catch (err: any) {
      setError(err.message ?? "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy">
            <option value="">— None —</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
          <input required type="number" min="0" step="0.01" value={form.price_usd}
            onChange={(e) => setForm({ ...form, price_usd: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty *</label>
          <input required type="number" min="0" step="1" value={form.stock_qty}
            onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            {uploading ? "Uploading image…" : "Uploaded images will be stored on the server."}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_second_hand}
              onChange={(e) => setForm({ ...form, is_second_hand: e.target.checked })} />
            Second Hand
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="bg-navy text-white px-6 py-2 rounded text-sm font-medium hover:bg-navy-light disabled:opacity-50">
          {saving ? "Saving…" : (product ? "Update" : "Create")}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-gray-300 px-6 py-2 rounded text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
