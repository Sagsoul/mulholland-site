import ProductGrid from "@/components/ProductGrid";
import { Product, Category } from "@/types";
import { getCategories as fetchCategories, getProducts as fetchProducts } from "@/lib/store";

interface Props {
  searchParams: { category?: string; q?: string };
}

async function getProducts(category?: string, q?: string): Promise<Product[]> {
  try {
    return fetchProducts({ categorySlug: category, q });
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    return fetchCategories();
  } catch {
    return [];
  }
}

export const metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: Props) {
  const [products, categories] = await Promise.all([
    getProducts(searchParams.category, searchParams.q),
    getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-navy mb-6">Shop</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <a
          href="/shop"
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !searchParams.category
              ? "bg-navy text-white border-navy"
              : "border-gray-300 text-gray-600 hover:border-navy hover:text-navy"
          }`}
        >
          All
        </a>
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              searchParams.category === cat.slug
                ? "bg-navy text-white border-navy"
                : "border-gray-300 text-gray-600 hover:border-navy hover:text-navy"
            }`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-6">
        {products.length} product{products.length !== 1 ? "s" : ""} found
        {searchParams.category ? ` in "${searchParams.category}"` : ""}
      </p>

      <ProductGrid products={products} emptyMessage="No products available in this category right now." />
    </div>
  );
}
