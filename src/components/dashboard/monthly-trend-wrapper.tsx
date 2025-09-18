'use client';

import { useState, useTransition } from 'react';
import { MonthlyTrendChart } from './monthly-trend-chart';
import { fetchMonthlyRevenue, type TimePeriod } from '@/app/actions/dashboard';

interface MonthlyTrendWrapperProps {
  initialData: Array<{
    month: string;
    revenue: number;
    costs: number;
    profit: number;
  }>;
}

const periodOptions = [
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All' },
] as const;

export function MonthlyTrendWrapper({ initialData }: MonthlyTrendWrapperProps) {
  const [data, setData] = useState(initialData);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('6m');
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    startTransition(async () => {
      try {
        const newData = await fetchMonthlyRevenue(period);
        setData(newData);
      } catch (error) {
        console.error('Failed to fetch revenue data:', error);
      }
    });
  };

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="chart-title">Monthly Revenue Trend</div>
        <select
          value={selectedPeriod}
          onChange={(e) => handlePeriodChange(e.target.value as TimePeriod)}
          disabled={isPending}
          style={{
            padding: '0.25rem 0.75rem',
            fontSize: '0.875rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border)',
            background: 'var(--background)',
            color: 'var(--text)',
            cursor: 'pointer',
            opacity: isPending ? 0.5 : 1,
          }}
        >
          {periodOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {isPending ? (
        <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      ) : (
        <MonthlyTrendChart data={data} />
      )}
    </div>
  );
}