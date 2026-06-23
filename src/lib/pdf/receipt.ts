import { COMPANY } from "@/lib/constants";
import { SaleItem } from "@/types";
import { formatUSD, formatDate } from "@/lib/format";

async function getJsPDF() {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  return { jsPDF, autoTable };
}

async function fetchLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const NAVY = [26, 58, 108] as const;
const GOLD = [245, 168, 0] as const;
const WHITE = [255, 255, 255] as const;

export async function generateReceiptPDF(
  saleId: string,
  items: SaleItem[],
  totalUsd: number,
  channel: "online" | "pos",
  customerName?: string
): Promise<{ blob: Blob; filename: string }> {
  const { jsPDF, autoTable } = await getJsPDF();
  const logoDataUrl = await fetchLogoDataUrl();

  // Receipt uses 80mm thermal-style width approximated as narrow A4
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 200] });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 20, "F");

  if (logoDataUrl) {
    // Real logo: place top-left, ~25mm wide
    doc.addImage(logoDataUrl, "PNG", 3, 2, 25, 16);
    // Company info to the right of logo
    doc.setTextColor(...GOLD);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name.toUpperCase(), 31, 8);
    doc.setTextColor(...WHITE);
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.address, 31, 13, { maxWidth: 46 });
    doc.text(`Tel: ${COMPANY.phones.business}`, 31, 17);
  } else {
    // Fallback: centered text header
    doc.setTextColor(...GOLD);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name.toUpperCase(), pageWidth / 2, 8, { align: "center" });
    doc.setTextColor(...WHITE);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.address, pageWidth / 2, 13, { align: "center" });
    doc.text(`Tel: ${COMPANY.phones.business}`, pageWidth / 2, 17, { align: "center" });
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text(`Receipt #: ${saleId.slice(0, 8).toUpperCase()}`, 4, 26);
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, 4, 31);
  doc.text(`Channel: ${channel.toUpperCase()}`, 4, 36);
  if (customerName) doc.text(`Customer: ${customerName}`, 4, 41);

  const tableData = items.map((item) => [
    item.product_name,
    item.quantity.toString(),
    formatUSD(item.unit_price_usd),
    formatUSD(item.line_total_usd),
  ]);

  autoTable(doc, {
    startY: customerName ? 46 : 41,
    head: [["Item", "Qty", "Unit", "Total"]],
    body: tableData,
    foot: [["", "", "TOTAL", formatUSD(totalUsd)]],
    headStyles: { fillColor: [...NAVY], textColor: [...WHITE], fontSize: 6 },
    footStyles: { fillColor: [...GOLD], textColor: [...NAVY], fontStyle: "bold", fontSize: 7 },
    styles: { fontSize: 6.5 },
    margin: { left: 3, right: 3 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 120;
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your business!", pageWidth / 2, finalY + 8, { align: "center" });
  doc.text("Terms: Cash with Order", pageWidth / 2, finalY + 13, { align: "center" });

  const blob = doc.output("blob");
  const filename = `MulhollandTraders-Receipt-${saleId.slice(0, 8).toUpperCase()}.pdf`;
  return { blob, filename };
}
