import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${COMPANY.name} — Pipe Repair, Waterproofing & Hardware`,
    template: `%s | ${COMPANY.name}`,
  },
  description: COMPANY.tagline,
  keywords: ["waterproofing", "pipe repair", "roof repair", "rubberguard", "Zimbabwe", "hardware"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans flex flex-col min-h-screen">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
