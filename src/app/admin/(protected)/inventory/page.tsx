"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatUSD } from "@/lib/format";
import type { ProductImage } from "@/types";

const MAX_IMAGES = 4;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type Product = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  stock_qty: number;
  images?: ProductImage[];
  is_active: boolean;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  stock_qty: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "0",
  stock_qty: "0",
  is_active: true,
};

function ImageUploadArea({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");

  function validateAndAdd(newFiles: File[]) {
    setFileError("");
    const valid: File[] = [];
    for (const f of newFiles) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setFileError(`"${f.name}" is not a supported image type.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`"${f.name}" exceeds the 5 MB limit.`);
        continue;
      }
      valid.push(f);
    }
    const combined = [...files, ...valid].slice(0, MAX_IMAGES);
    onChange(combined);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    validateAndAdd(Array.from(e.dataTransfer.files));
  }

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  }

  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  return (
    <div className="col-span-2 space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Images ({files.length} of {MAX_IMAGES})
      </label>
      {fileError && <p className="text-xs text-red-600">{fileError}</p>}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver ? "border-navy bg-navy/5" : "border-gray-300 hover:border-navy"
        } ${files.length >= MAX_IMAGES ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      >
        <p className="text-sm text-gray-500">
          {files.length >= MAX_IMAGES
            ? "Maximum images reached"
            : "Drag & drop images here or click to select"}
        </p>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP · max 5 MB each</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) validateAndAdd(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {/* Previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded border overflow-hidden group">
              <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" sizes="80px" />
              <button
                type="button"
                aria-label={`Remove image ${i + 1}`}
                onClick={() => removeFile(i)}
                className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch products");
      setProducts(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProducts(); }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("price", form.price);
      fd.append("stock_qty", form.stock_qty);
      fd.append("is_active", form.is_active ? "true" : "false");
      imageFiles.forEach((f) => fd.append("images", f));

      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save product");

      setSuccessMsg(isEditing ? "Product updated." : "Product created.");
      await loadProducts();
      resetForm();
    } catch (err: any) {
      setError(err.message ?? "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setImageFiles([]);
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      stock_qty: String(product.stock_qty),
      is_active: product.is_active,
    });
    setImageFiles([]);
    setSuccessMsg("");
    setError("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    setError("");
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to delete product"); return; }
    await loadProducts();
    if (editingId === id) resetForm();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Create, edit, and delete products.</p>
        </div>
        <Link
          href="/admin/import-inventory"
          className="bg-gold text-navy px-4 py-2 rounded text-sm font-medium hover:bg-gold/80 transition-colors"
        >
          📥 Import CSV
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-navy mb-4">{isEditing ? "Edit Product" : "Add Product"}</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Stock Qty"
            value={form.stock_qty}
            onChange={(e) => setForm((p) => ({ ...p, stock_qty: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
            rows={3}
          />

          <ImageUploadArea files={imageFiles} onChange={setImageFiles} />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
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
                onClick={resetForm}
                className="border border-gray-300 px-5 py-2 rounded text-sm"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        {successMsg && <p className="text-sm text-green-600 mt-3">{successMsg}</p>}
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
                  <th className="text-left px-3 py-2">Image</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">SKU</th>
                  <th className="text-right px-3 py-2">Price</th>
                  <th className="text-right px-3 py-2">Stock</th>
                  <th className="text-center px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const thumb = product.images?.[0]?.image_path;
                  return (
                    <tr key={product.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100">
                          {thumb ? (
                            <Image src={thumb} alt={product.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-300 text-xs">—</div>
                          )}
                        </div>
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
