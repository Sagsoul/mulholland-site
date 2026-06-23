import { COMPANY, ABOUT } from "@/lib/constants";
import Image from "next/image";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Hero */}
      <div className="text-center mb-14">
        <Image src="/logo.svg" alt={COMPANY.name} width={180} height={54} className="mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-navy mb-3">{COMPANY.name}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{COMPANY.tagline}</p>
      </div>

      {/* Vision */}
      <section className="bg-navy text-white rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold text-gold mb-4">Our Vision</h2>
        <p className="text-gray-200 leading-relaxed">{ABOUT.vision}</p>
      </section>

      {/* Mission */}
      <section className="bg-yellow-brand rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold text-navy mb-4">Our Mission</h2>
        <p className="text-navy/80 leading-relaxed">{ABOUT.mission}</p>
      </section>

      {/* Core Values */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-navy mb-6">Core Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ABOUT.coreValues.map((value) => (
            <div key={value.title} className="bg-white rounded-xl shadow p-5 border-l-4 border-gold">
              <h3 className="font-bold text-navy mb-2">{value.title}</h3>
              <p className="text-sm text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Goals */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-navy mb-6">Our Goals</h2>
        <ul className="space-y-3">
          {ABOUT.goals.map((goal, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="bg-gold text-navy rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-gray-700">{goal}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Scope of Work */}
      <section className="bg-gray-50 rounded-2xl p-8 mb-10">
        <h2 className="text-2xl font-bold text-navy mb-4">Scope of Work</h2>
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{ABOUT.scopeOfWork}</p>
      </section>

      {/* Contact details */}
      <section className="bg-navy text-white rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gold mb-6">Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Addresses</h3>
            <p className="text-sm text-gray-200">{COMPANY.address}</p>
            <p className="text-sm text-gray-400 mt-1">{COMPANY.altAddress}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Contact</h3>
            <p className="text-sm text-gray-200">📞 {COMPANY.phones.business}</p>
            <p className="text-sm text-gray-200">📧 {COMPANY.email}</p>
            <p className="text-sm text-gray-200">🌐 {COMPANY.website}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Team</h3>
            <p className="text-sm text-gray-200">Douglas: {COMPANY.phones.douglas}</p>
            <p className="text-sm text-gray-200">Ruramai: {COMPANY.phones.ruramai}</p>
            <p className="text-sm text-gray-200">Vic: {COMPANY.phones.vic}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Registration</h3>
            <p className="text-sm text-gray-200">VAT: {COMPANY.vat}</p>
            <p className="text-sm text-gray-200">TIN: {COMPANY.tin}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
