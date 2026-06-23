"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/inventory", label: "Inventory", icon: "📦" },
  { href: "/admin/pos", label: "POS Terminal", icon: "🏪" },
  { href: "/admin/sales", label: "Sales", icon: "💰" },
  { href: "/admin/pricelist", label: "Price List", icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <aside className="w-64 bg-navy text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-navy-light flex flex-col items-start gap-2">
        <Image src="/logo.png" alt="Mulholland Traders Pvt Ltd" width={160} height={48} />
        <p className="text-xs text-gray-400">Admin Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-gold text-navy"
                : "hover:bg-navy-light text-gray-200"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-navy-light">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-navy-light rounded transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
