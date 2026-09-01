"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Product } from "@/types";

const MAX_IMAGES = 4;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface Props {
  product?: Product;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({ product, onSave, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price_usd?.toString() ?? "",
    stock_qty: product?.stock_qty?.toString() ?? "0",
    is_active: product?.is_active ?? true,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

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
    setImageFiles((prev) => [...prev, ...valid].slice(0, MAX_IMAGES));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("price", form.price);
      fd.append("stock_qty", form.stock_qty);
      fd.append("is_active", form.is_active ? "true" : "false");
      imageFiles.forEach((f) => fd.append("images", f));
      await onSave(fd);
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        {product?.sku && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU (auto-generated)</label>
            <p className="text-sm font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
              {product.sku}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty *</label>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={form.stock_qty}
            onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images ({imageFiles.length} of {MAX_IMAGES})
          </label>
          {fileError && <p className="text-xs text-red-600 mb-1">{fileError}</p>}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload images"
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              dragOver ? "border-navy bg-navy/5" : "border-gray-300 hover:border-navy"
            } ${imageFiles.length >= MAX_IMAGES ? "opacity-50 pointer-events-none" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); validateAndAdd(Array.from(e.dataTransfer.files)); }}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          >
            <p className="text-sm text-gray-500">
              {imageFiles.length >= MAX_IMAGES ? "Maximum images reached" : "Drag & drop or click to select images"}
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
          {imageFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded border overflow-hidden group">
                  <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" sizes="80px" />
                  <button
                    type="button"
                    aria-label={`Remove image ${i + 1}`}
                    onClick={() => setImageFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-navy text-white px-6 py-2 rounded text-sm font-medium hover:bg-navy-light disabled:opacity-50"
        >
          {saving ? "Saving…" : product ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 px-6 py-2 rounded text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
