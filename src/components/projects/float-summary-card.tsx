'use client';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/export/utils';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface FloatSummaryCardProps {
  floatReceived: number;
  totalCostsPaid: number;
  projectId: string;
}

export function FloatSummaryCard({
  floatReceived,
  totalCostsPaid,
  projectId
}: FloatSummaryCardProps) {
  const floatBalance = floatReceived - totalCostsPaid;
  const floatUtilization = floatReceived > 0
    ? (totalCostsPaid / floatReceived) * 100
    : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Float Summary
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Float Received</span>
          <span className="font-semibold text-lg">
            {formatCurrency(floatReceived)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Costs Paid</span>
          <span className="font-semibold text-lg">
            {formatCurrency(totalCostsPaid)}
          </span>
        </div>

        <div className="pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Float Balance</span>
            <div className="flex items-center gap-2">
              {floatBalance >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`font-bold text-lg ${
                floatBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(floatBalance)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Float Utilization</span>
            <span className="text-sm font-medium">{floatUtilization.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all ${
                floatUtilization > 90 ? 'bg-red-600' :
                floatUtilization > 70 ? 'bg-yellow-600' :
                'bg-green-600'
              }`}
              style={{ width: `${Math.min(floatUtilization, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}