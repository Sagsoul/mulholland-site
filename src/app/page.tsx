import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ProductGrid from "@/components/ProductGrid";
import { COMPANY, PRODUCT_CATEGORIES } from "@/lib/constants";
import { Product } from "@/types";

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .gt("stock_qty", 0)
      .order("created_at", { ascending: false })
      .limit(8);
    return (data as Product[]) ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <Image src="/logo.svg" alt={COMPANY.name} width={200} height={60} className="mx-auto" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gold">Zimbabwe&apos;s</span> Waterproofing &amp; Repair Specialists
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            {COMPANY.tagline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-gold text-center">
              Shop Now
            </Link>
            <Link href="/pricelist" className="border border-white text-white px-6 py-2.5 rounded-lg font-medium hover:bg-white/10 transition-colors text-center">
              View Price List
            </Link>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRODUCT_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:border-gold hover:bg-yellow-50 transition-all group"
              >
                <p className="text-sm font-semibold text-navy group-hover:text-gold">{cat.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-14 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-navy">Latest Products</h2>
              <Link href="/shop" className="text-gold hover:text-gold-dark font-medium text-sm">
                View all →
              </Link>
            </div>
            <ProductGrid products={featured} />
          </div>
        </section>
      )}

      {/* Value proposition */}
      <section className="py-14 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: "🏆", title: "Authorised Distributor", desc: "Official distributor of Rubberguard, Beecool, FibreFix and EasySeal in Zimbabwe" },
              { icon: "🚀", title: "WhatsApp Checkout", desc: "Order online, get your pro-forma invoice and confirm via WhatsApp instantly" },
              { icon: "♻️", title: "Second-Hand Marketplace", desc: "Quality pre-owned goods at competitive prices — once sold, gone!" },
            ].map((item) => (
              <div key={item.title}>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="bg-yellow-brand py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-navy text-lg">Questions? We&apos;re here to help.</p>
            <p className="text-navy/70 text-sm">{COMPANY.address}</p>
          </div>
          <div className="flex gap-4">
            <a href={`tel:${COMPANY.phones.business}`}
              className="bg-navy text-white px-5 py-2.5 rounded-lg font-medium hover:bg-navy-dark transition-colors">
              📞 Call Us
            </a>
            <a href={`https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
              className="bg-green-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors">
              💬 WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
