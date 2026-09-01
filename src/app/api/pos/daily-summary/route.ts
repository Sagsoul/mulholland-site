import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-auth-route';
import { get } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);

    const summary = await get<{ count: number; revenue: number | null }>(
      `SELECT COUNT(*) as count, SUM(total_usd) as revenue
       FROM sales
       WHERE channel = 'pos'
         AND date(created_at) = ?`,
      [today]
    );

    return NextResponse.json({
      date: today,
      sale_count: summary?.count ?? 0,
      revenue: summary?.revenue ?? 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to fetch summary' }, { status: 500 });
  }
}
