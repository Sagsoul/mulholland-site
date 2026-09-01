import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-auth-route';
import { getSaleById } from '@/lib/store';

interface Context {
  params: { saleId: string };
}

export async function GET(request: NextRequest, context: Context) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sale = await getSaleById(context.params.saleId);
    if (!sale) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to fetch invoice' }, { status: 500 });
  }
}
