import { COMPANY } from "@/lib/constants";
import { CartItem } from "@/types";
import { formatUSD, formatDate } from "@/lib/format";

// Dynamic import to avoid SSR issues
async function getJsPDF() {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  return { jsPDF, autoTable };
}

const NAVY = [26, 58, 108] as const;
const GOLD = [245, 168, 0] as const;
const YELLOW = [255, 230, 0] as const;
const WHITE = [255, 255, 255] as const;
const LIGHT_GRAY = [245, 245, 245] as const;

export async function generateProFormaInvoicePDF(
  saleId: string,
  items: CartItem[],
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  notes?: string
): Promise<{ blob: Blob; filename: string }> {
  const { jsPDF, autoTable } = await getJsPDF();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Logo box
  doc.setFillColor(...YELLOW);
  doc.rect(pageWidth - 42, 2, 38, 24, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MT", pageWidth - 23, 13, { align: "center" });
  doc.setFontSize(6);
  doc.text("EST. 1995", pageWidth - 23, 20, { align: "center" });

  // Company name
  doc.setTextColor(...GOLD);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name.toUpperCase(), 10, 12);
  doc.setTextColor(...WHITE);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.tagline, 10, 19);
  doc.text(`${COMPANY.address}  |  Tel: ${COMPANY.phones.business}  |  ${COMPANY.email}`, 10, 25);

  // Yellow title bar
  doc.setFillColor(...YELLOW);
  doc.rect(0, 30, pageWidth, 10, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PRO-FORMA INVOICE", pageWidth / 2, 37, { align: "center" });

  // Sale meta
  const today = new Date().toISOString();
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Invoice #: ${saleId.slice(0, 8).toUpperCase()}`, 10, 48);
  doc.text(`Date: ${formatDate(today)}`, 10, 54);
  doc.text(`Terms: Cash with Order`, 10, 60);

  // Customer block
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(pageWidth / 2, 43, pageWidth / 2 - 10, 24, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", pageWidth / 2 + 4, 50);
  doc.setFont("helvetica", "normal");
  doc.text(customerName, pageWidth / 2 + 4, 56);
  doc.text(customerPhone, pageWidth / 2 + 4, 61);
  const addrLines = doc.splitTextToSize(customerAddress, 70);
  doc.text(addrLines, pageWidth / 2 + 4, 66);

  // Items table
  const subtotal = items.reduce((s, i) => s + i.product.price_usd * i.quantity, 0);
  const tableData = items.map((item) => [
    item.product.sku ?? "-",
    item.product.name,
    item.quantity.toString(),
    formatUSD(item.product.price_usd),
    formatUSD(item.product.price_usd * item.quantity),
  ]);

  autoTable(doc, {
    startY: 72,
    head: [["Part No.", "Description", "Qty", "Unit Price", "Line Total"]],
    body: tableData,
    foot: [
      ["", "", "", "Subtotal (USD)", formatUSD(subtotal)],
      ["", "", "", "TOTAL (USD)", formatUSD(subtotal)],
    ],
    headStyles: { fillColor: [...NAVY], textColor: [...WHITE], fontStyle: "bold" },
    footStyles: { fillColor: [...GOLD], textColor: [...NAVY], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [...LIGHT_GRAY] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 80 },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    styles: { fontSize: 8.5 },
    margin: { left: 10, right: 10 },
  });

  // Notes
  const finalY = (doc as any).lastAutoTable?.finalY ?? 180;
  if (notes) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Notes: ${notes}`, 10, finalY + 8);
  }

  // Footer banner
  const footY = doc.internal.pageSize.getHeight() - 18;
  doc.setFillColor(...NAVY);
  doc.rect(0, footY, pageWidth, 18, "F");
  doc.setTextColor(...GOLD);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.tagline, pageWidth / 2, footY + 7, { align: "center" });
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.text(
    `VAT: ${COMPANY.vat}  |  TIN: ${COMPANY.tin}  |  ${COMPANY.website}`,
    pageWidth / 2,
    footY + 13,
    { align: "center" }
  );

  const blob = doc.output("blob");
  const filename = `MulhollandTraders-ProForma-${saleId.slice(0, 8).toUpperCase()}.pdf`;
  return { blob, filename };
}
