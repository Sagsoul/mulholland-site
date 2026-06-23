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
      const [catRes] = await Promise.all([
        fetch("/api/products?categories=1").then((r) => r.json()).catch(() => ({ categories: [] })),
      ]);

      // Fetch categories from separate endpoint
      const cRes = await fetch("/api/products?_meta=categories").catch(() => null);

      // Simpler: fetch categories via supabase client
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: cats } = await supabase.from("categories").select("*").order("sort_order");
      setCategories((cats as Category[]) ?? []);

      if (!isNew) {
        const { data } = await supabase.from("products").select("*, category:categories(*)").eq("id", params.id).single();
        setProduct(data as Product);
      }
      setLoading(false);
    }
    load();
  }, [params.id, isNew]);

  const handleSave = async (data: Partial<Product>) => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    if (isNew) {
      const { error } = await supabase.from("products").insert([data]);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("products").update(data).eq("id", params.id);
      if (error) throw new Error(error.message);
    }
    router.push("/admin/inventory");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", params.id);
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
