'use client';

import { formatCurrency } from '@/lib/export/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface PhaseSummaryData {
  phaseId: string;
  phaseName: string;
  phaseColor?: string;
  estimatedRevenue: number;
  estimatedCost: number;
  actualRevenue: number;
  actualCosts: number;
  totalPaidToDate: number;
  costsDue: number;
  variance: number;
  progress: number;
}

interface PhaseSummaryTableProps {
  phases: PhaseSummaryData[];
  floatBalance?: number;
}

export function PhaseSummaryTable({
  phases,
  floatBalance
}: PhaseSummaryTableProps) {
  const totals = phases.reduce(
    (acc, phase) => ({
      estimatedRevenue: acc.estimatedRevenue + phase.estimatedRevenue,
      estimatedCost: acc.estimatedCost + phase.estimatedCost,
      actualRevenue: acc.actualRevenue + phase.actualRevenue,
      actualCosts: acc.actualCosts + phase.actualCosts,
      paid: acc.paid + phase.totalPaidToDate,
      due: acc.due + phase.costsDue,
      variance: acc.variance + phase.variance,
    }),
    { estimatedRevenue: 0, estimatedCost: 0, actualRevenue: 0, actualCosts: 0, paid: 0, due: 0, variance: 0 }
  );

  const totalRevenue = totals.actualRevenue + totals.estimatedRevenue;
  const totalCosts = totals.actualCosts + totals.estimatedCost;
  const totalProfit = totalRevenue - totalCosts;
  const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Build Stage</TableHead>
            <TableHead className="text-right">Progress</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Costs</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Margin</TableHead>
            <TableHead className="text-right">Paid to Date</TableHead>
            <TableHead className="text-right">Costs Due</TableHead>
            <TableHead className="text-right">Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {phases.map((phase) => {
            const phaseRevenue = phase.actualRevenue + phase.estimatedRevenue;
            const phaseCosts = phase.actualCosts + phase.estimatedCost;
            const phaseProfit = phaseRevenue - phaseCosts;
            const phaseMargin = phaseRevenue > 0 ? (phaseProfit / phaseRevenue) * 100 : 0;

            return (
              <TableRow key={phase.phaseId} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {phase.phaseColor && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: phase.phaseColor }}
                      />
                    )}
                    <span className="font-medium">{phase.phaseName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-secondary rounded-full h-2">
                      <div
                        className="h-full rounded-full transition-all bg-primary"
                        style={{ width: `${Math.min(phase.progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                      {phase.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(phaseRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(phaseCosts)}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  phaseProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(phaseProfit)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {phaseMargin.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(phase.totalPaidToDate)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(phase.costsDue)}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  phase.variance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(phase.variance)}
                </TableCell>
              </TableRow>
            );
          })}

          <TableRow className="font-bold border-t-2 bg-muted/30">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">
              <span className="text-sm text-muted-foreground">
                {Math.round((totals.paid / totals.estimatedCost) * 100) || 0}%
              </span>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(totalRevenue)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(totalCosts)}
            </TableCell>
            <TableCell className={`text-right ${
              totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalProfit)}
            </TableCell>
            <TableCell className="text-right">
              {totalMargin.toFixed(1)}%
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(totals.paid)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(totals.due)}
            </TableCell>
            <TableCell className={`text-right ${
              totals.variance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totals.variance)}
            </TableCell>
          </TableRow>
          {floatBalance !== undefined && (
            <TableRow className="border-t bg-blue-50/50">
              <TableCell colSpan={8} className="text-right font-medium">
                Float Balance
              </TableCell>
              <TableCell className="text-right font-bold text-blue-600">
                {formatCurrency(floatBalance)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}