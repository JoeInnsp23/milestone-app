'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface MonthlyTrendChartProps {
  data: Array<{
    month: string;
    revenue: number;
    costs: number;
    profit: number;
  }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const formatCurrency = (value: number) => {
    return `£${value.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ color: string; name: string; value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-muted)' }}
        />
        <YAxis
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-muted)' }}
          tickFormatter={formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Revenue"
        />
        <Line
          type="monotone"
          dataKey="costs"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Costs"
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Net Profit"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}