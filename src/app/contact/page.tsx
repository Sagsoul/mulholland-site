import { COMPANY } from "@/lib/constants";

export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-bold text-navy mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-10">Get in touch — we&apos;d love to hear from you.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact cards */}
        <div className="space-y-6">
          {[
            {
              icon: "📍",
              title: "Main Office",
              lines: [COMPANY.address],
            },
            {
              icon: "🏭",
              title: "Warehouse / Collection",
              lines: [COMPANY.altAddress],
            },
            {
              icon: "📞",
              title: "Phone",
              lines: [
                `Business: ${COMPANY.phones.business}`,
                `Douglas: ${COMPANY.phones.douglas}`,
                `Ruramai: ${COMPANY.phones.ruramai}`,
                `Vic: ${COMPANY.phones.vic}`,
              ],
            },
            {
              icon: "✉️",
              title: "Email",
              lines: [COMPANY.email],
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl shadow p-5 flex gap-4">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-navy mb-1">{item.title}</h3>
                {item.lines.map((line) => (
                  <p key={line} className="text-sm text-gray-600">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <div className="bg-navy text-white rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gold mb-4">💬 Chat on WhatsApp</h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              The fastest way to reach us. Send us a message, ask about products, get a quote or confirm your order.
            </p>
          </div>
          <a
            href={`https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold text-center text-lg py-4"
          >
            Open WhatsApp Chat
          </a>
          <p className="text-xs text-gray-400 mt-3 text-center">{COMPANY.whatsapp}</p>
        </div>
      </div>
    </div>
  );
}
