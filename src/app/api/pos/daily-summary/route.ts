import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-auth-route';
import { get } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const dateParts = new Intl.DateTimeFormat('en', {
      timeZone: 'Africa/Harare',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const utcStart = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), -2));
    const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000);
    const start = utcStart.toISOString().replace('T', ' ').slice(0, 19);
    const end = utcEnd.toISOString().replace('T', ' ').slice(0, 19);

    const summary = await get<{ count: number; revenue: number | null }>(
      `SELECT COUNT(*) as count, SUM(total_usd) as revenue
       FROM sales
       WHERE channel = 'pos'
         AND created_at >= ?
         AND created_at < ?`,
      [start, end]
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
