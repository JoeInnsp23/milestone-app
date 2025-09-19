'use client';

import { useEffect, useState, memo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface ProfitData {
  name: string;
  profit: number;
  margin: number;
}

interface ProfitChartProps {
  data: ProfitData[];
}

export const ProfitChart = memo(function ProfitChart({ data }: ProfitChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getBarColor = (profit: number) => {
    return profit >= 0
      ? (isDark ? '#34d399' : '#10b981')
      : (isDark ? '#f87171' : '#ef4444');
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{value: number; payload: {margin: number}}>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Project
            </span>
            <span className="font-bold text-foreground">
              {label}
            </span>
          </div>
          <div className="mt-2 flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Net Profit
            </span>
            <span className="font-bold text-foreground">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
          <div className="mt-2 flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Margin
            </span>
            <span className="font-bold text-foreground">
              {payload[0].payload.margin.toFixed(1)}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
        />
        <XAxis
          dataKey="name"
          className="text-xs"
          tick={{ fill: isDark ? '#94a3b8' : '#6b7280' }}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: isDark ? '#94a3b8' : '#6b7280' }}
          tickFormatter={formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.profit)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});