"use client";

export default function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-navy text-white px-4 py-2 rounded text-sm font-medium hover:bg-navy-light"
    >
      Print / Save PDF
    </button>
  );
}
