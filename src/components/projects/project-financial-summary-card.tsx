'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/export/utils';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface ProjectFinancialSummaryCardProps {
  actualRevenue: number;
  actualCosts: number;
  estimatedRevenue: number;
  estimatedCosts: number;
}

export function ProjectFinancialSummaryCard({
  actualRevenue,
  actualCosts,
  estimatedRevenue,
  estimatedCosts,
}: ProjectFinancialSummaryCardProps) {
  const [includeEstimates, setIncludeEstimates] = useState(true);

  // Calculate totals based on toggle
  const totalIncome = includeEstimates ? actualRevenue + estimatedRevenue : actualRevenue;
  const totalCosts = includeEstimates ? actualCosts + estimatedCosts : actualCosts;

  // Calculate profits
  const grossProfit = totalIncome - (totalCosts * 0.6); // 60% as cost of sales
  const netProfit = totalIncome - totalCosts;
  const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
  const netMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Check if there are any estimates
  const hasEstimates = estimatedRevenue > 0 || estimatedCosts > 0;

  return (
    <div className="dashboard-card">
      {/* Card Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Summary
        </h3>
        {hasEstimates && (
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">Include Estimates</span>
            <input
              type="checkbox"
              checked={includeEstimates}
              onChange={(e) => setIncludeEstimates(e.target.checked)}
              className="estimates-toggle"
            />
          </label>
        )}
      </div>

      <div className="space-y-4">
        {/* Total Income */}
        <div className="pb-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                Total Income
              </div>
              {includeEstimates && hasEstimates && (
                <div className="text-xs text-muted-foreground">
                  includes {formatCurrency(estimatedRevenue)} estimates
                </div>
              )}
              {!includeEstimates && hasEstimates && (
                <div className="text-xs text-muted-foreground">
                  actuals only
                </div>
              )}
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalIncome)}
            </div>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="pb-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                Gross Profit
              </div>
              <div className="text-xs text-muted-foreground">
                {grossMargin.toFixed(1)}% margin
              </div>
            </div>
            <div className="flex items-center gap-2">
              {grossProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-2xl font-bold ${
                grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(grossProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                Net Profit
              </div>
              <div className="text-xs text-muted-foreground">
                {netMargin.toFixed(1)}% margin
              </div>
              {includeEstimates && hasEstimates && (
                <div className="text-xs text-muted-foreground mt-1">
                  includes {formatCurrency(estimatedRevenue - estimatedCosts)} est. profit
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {netProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-2xl font-bold ${
                netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}