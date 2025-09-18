'use server';

import { getMonthlyRevenue } from '@/lib/queries';

export type TimePeriod = '1m' | '3m' | '6m' | '1y' | 'all';

export async function fetchMonthlyRevenue(period: TimePeriod) {
  const data = await getMonthlyRevenue(period);

  return Array.isArray(data) ? data.map((item: Record<string, unknown>) => ({
    month: String(item.month || ''),
    revenue: Number(item.revenue || 0),
    costs: Number(item.costs || 0),
    profit: Number(item.profit || 0)
  })) : [];
}