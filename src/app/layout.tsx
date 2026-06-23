import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${COMPANY.name} — Pipe Repair, Waterproofing & Hardware`,
    template: `%s | ${COMPANY.name}`,
  },
  description: COMPANY.tagline,
  keywords: ["waterproofing", "pipe repair", "roof repair", "rubberguard", "Zimbabwe", "hardware"],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: `${COMPANY.name} — Pipe Repair, Waterproofing & Hardware`,
    description: COMPANY.tagline,
    images: [{ url: "/logo.png", width: 400, height: 120, alt: "Mulholland Traders Pvt Ltd" }],
  },
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
