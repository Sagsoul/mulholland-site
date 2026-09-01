import { NextRequest, NextResponse } from 'next/server';
import { getSaleById } from '@/lib/store';

interface Context {
  params: { saleId: string };
}

export async function GET(_: NextRequest, context: Context) {
  try {
    const sale = await getSaleById(context.params.saleId);
    if (!sale) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to fetch invoice' }, { status: 500 });
  }
}
