"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { Product, Category } from "@/types";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    async function load() {
      const categoriesResponse = await fetch("/api/categories");
      const categoryData = await categoriesResponse.json();
      setCategories((categoryData as Category[]) ?? []);

      if (!isNew) {
        const productResponse = await fetch(`/api/products/${params.id}`);
        const productData = await productResponse.json();
        if (productResponse.ok) {
          setProduct(productData as Product);
        }
      }
      setLoading(false);
    }
    load();
  }, [params.id, isNew]);

  const handleSave = async (data: Partial<Product>) => {
    const response = await fetch(isNew ? "/api/products" : `/api/products/${params.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? "Failed to save product");
    }
    if (isNew) {
      router.push("/admin/inventory");
      return;
    }
    router.push("/admin/inventory");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/products/${params.id}`, { method: "DELETE" });
    router.push("/admin/inventory");
  };

  if (loading) return <div className="text-gray-500">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">{isNew ? "New Product" : "Edit Product"}</h1>
        {!isNew && (
          <button onClick={handleDelete}
            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded text-sm hover:bg-red-100">
            Delete Product
          </button>
        )}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <ProductForm
          product={product}
          categories={categories}
          onSave={handleSave}
          onCancel={() => router.push("/admin/inventory")}
        />
      </div>
    </div>
  );
}
