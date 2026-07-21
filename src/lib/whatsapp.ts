import { COMPANY } from "./constants";
import { CartItem } from "@/types";
import { formatUSD } from "./format";

export function buildProductWhatsAppMessage({
  productName,
  quantity,
  unitPriceUsd,
  productUrl,
}: {
  productName: string;
  quantity: number;
  unitPriceUsd: number;
  productUrl: string;
}): string {
  const total = unitPriceUsd * quantity;

  return [
    `Hello Mulholland Traders, I'd like to buy this item via WhatsApp.`,
    ``,
    `*Product:* ${productName}`,
    `*Quantity:* ${quantity}`,
    `*Price Summary:* ${formatUSD(unitPriceUsd)} each · ${formatUSD(total)} total`,
    `*Product Link:* ${productUrl}`,
  ].join("\n");
}

export function buildWhatsAppOrderMessage(
  saleId: string,
  items: CartItem[],
  totalUsd: number,
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  notes?: string,
  summaryUrl?: string
): string {
  const itemLines = items
    .map(
      (item) =>
        `  • ${item.product.name} × ${item.quantity} @ ${formatUSD(item.product.price_usd)} = ${formatUSD(item.product.price_usd * item.quantity)}`
    )
    .join("\n");

  const message = [
    `Hello Mulholland Traders, I'd like to place an order.`,
    ``,
    `Order #${saleId.slice(0, 8).toUpperCase()}`,
    ``,
    `*Items:*`,
    itemLines,
    ``,
    `*Total: ${formatUSD(totalUsd)}*`,
    ``,
    `*Customer Details:*`,
    `Name: ${customerName}`,
    `Phone: ${customerPhone}`,
    `Address: ${customerAddress}`,
    notes ? `Notes: ${notes}` : null,
    summaryUrl ? `Order Summary: ${summaryUrl}` : null,
    ``,
    `Please confirm availability and payment details. I have a pro-forma invoice attached.`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return message;
}

export function buildWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}?text=${encoded}`;
}
