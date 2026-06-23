import Link from "next/link";
import Image from "next/image";
import { COMPANY } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Image src="/logo.png" alt="Mulholland Traders Pvt Ltd" width={140} height={42} className="mb-3" />
            <p className="text-sm text-gray-300 mb-3">{COMPANY.tagline}</p>
            <p className="text-xs text-gray-400">{COMPANY.address}</p>
            <p className="text-xs text-gray-400 mt-1">{COMPANY.altAddress}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 text-gold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/shop", label: "Shop" },
                { href: "/pricelist", label: "Price List" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-gold transition-colors text-gray-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 text-gold">Contact Us</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>📞 {COMPANY.phones.business}</li>
              <li>📧 {COMPANY.email}</li>
              <li>
                <a
                  href={`https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors"
                >
                  💬 WhatsApp Us
                </a>
              </li>
            </ul>
            <div className="mt-3 text-xs text-gray-400">
              <p>VAT: {COMPANY.vat}</p>
              <p>TIN: {COMPANY.tin}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-navy-light mt-8 pt-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
