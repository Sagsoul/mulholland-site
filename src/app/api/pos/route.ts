import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-auth-route';
import { createSale, getSales } from '@/lib/store';
import type { SaleRecord, SaleItemRecord } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return recent POS sales
    const sales = await getSales();
    const posSales = sales.filter((s) => s.channel === 'pos');
    return NextResponse.json(posSales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    const sale = await createSale({
      channel: 'pos',
      customer_name: body.customer_name || null,
      customer_email: body.customer_email || null,
      customer_phone: body.customer_phone || null,
      customer_address: body.customer_address || null,
      payment_method: body.payment_method || 'cash',
      discount_amount: body.discount_amount ?? 0,
      discount_type: body.discount_type ?? 'fixed',
      notes: body.notes || null,
      items: body.items,
    });

    if (!sale) {
      return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
    }

    // Try to send invoice email if customer email provided (non-blocking)
    if (body.customer_email?.trim()) {
      void sendInvoiceEmail(sale, body.customer_email.trim()).catch((err) => {
        console.error('Failed to send invoice email:', err);
      });
    }

    return NextResponse.json({
      sale_id: sale.id,
      invoice_number: sale.invoice_number,
      invoice_url: `/invoices/${sale.id}`,
      total_usd: sale.total_usd,
      subtotal_usd: sale.subtotal_usd,
      discount_amount: sale.discount_amount,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to process sale' }, { status: 400 });
  }
}

async function sendInvoiceEmail(sale: SaleRecord & { items?: SaleItemRecord[] }, email: string) {
  const { Resend } = await import('resend');
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Mulholland Traders <onboarding@resend.dev>';

  const items = sale.items ?? [];
  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${item.product_name ?? item.product_id}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.quantity}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${item.unit_price_usd.toFixed(2)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">$${item.line_total_usd.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const discountRow =
    sale.discount_amount > 0
      ? `<tr><td colspan="3" style="padding:6px 8px;text-align:right;font-weight:600;">Discount</td><td style="padding:6px 8px;text-align:right;color:#dc2626;">-$${sale.discount_amount.toFixed(2)}</td></tr>`
      : '';

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f3f5f8;padding:24px;color:#0f172a;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#1e3a8a;color:#ffffff;padding:20px 24px;">
          <h1 style="margin:0;font-size:22px;">Mulholland Traders Pvt Ltd</h1>
          <p style="margin:4px 0 0;font-size:14px;opacity:0.8;">Invoice ${sale.invoice_number}</p>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 8px;font-size:14px;color:#475569;">Date: ${new Date(sale.created_at).toLocaleString('en-ZW')}</p>
          ${sale.customer_name ? `<p style="margin:0 0 4px;font-size:14px;">Customer: <strong>${sale.customer_name}</strong></p>` : ''}
          ${sale.customer_phone ? `<p style="margin:0 0 4px;font-size:14px;">Phone: ${sale.customer_phone}</p>` : ''}
          ${sale.customer_address ? `<p style="margin:0 0 4px;font-size:14px;">Address: ${sale.customer_address}</p>` : ''}
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;">Product</th>
                <th style="padding:8px;text-align:right;border-bottom:2px solid #e2e8f0;">Qty</th>
                <th style="padding:8px;text-align:right;border-bottom:2px solid #e2e8f0;">Unit Price</th>
                <th style="padding:8px;text-align:right;border-bottom:2px solid #e2e8f0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              <tr><td colspan="3" style="padding:6px 8px;text-align:right;font-weight:600;">Subtotal</td><td style="padding:6px 8px;text-align:right;">$${sale.subtotal_usd.toFixed(2)}</td></tr>
              ${discountRow}
              <tr style="background:#f8fafc;font-size:16px;font-weight:bold;"><td colspan="3" style="padding:8px;text-align:right;">TOTAL</td><td style="padding:8px;text-align:right;color:#1e3a8a;">$${sale.total_usd.toFixed(2)}</td></tr>
            </tbody>
          </table>
          <p style="margin:16px 0 4px;font-size:14px;color:#475569;">Payment method: ${sale.payment_method}</p>
          ${sale.notes ? `<p style="margin:4px 0;font-size:14px;color:#475569;">Notes: ${sale.notes}</p>` : ''}
          <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0;" />
          <p style="margin:0;font-size:13px;color:#94a3b8;">Thank you for your purchase from Mulholland Traders Pvt Ltd.</p>
        </div>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `Invoice ${sale.invoice_number} - Mulholland Traders`,
    html,
  });
}
