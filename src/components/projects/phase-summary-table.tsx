'use client';

import { formatCurrency } from '@/lib/export/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface PhaseSummaryData {
  phaseId: string;
  phaseName: string;
  estimatedCost: number;
  totalPaidToDate: number;
  costsDue: number;
  variance: number;
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
      estimated: acc.estimated + phase.estimatedCost,
      paid: acc.paid + phase.totalPaidToDate,
      due: acc.due + phase.costsDue,
      variance: acc.variance + phase.variance,
    }),
    { estimated: 0, paid: 0, due: 0, variance: 0 }
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Build Stage</TableHead>
            <TableHead className="text-right">Estimated Cost</TableHead>
            <TableHead className="text-right">Total Cost Paid to Date</TableHead>
            <TableHead className="text-right">Costs Due</TableHead>
            <TableHead className="text-right">Variance to Estimate</TableHead>
            {floatBalance !== undefined && (
              <TableHead className="text-right">Float Balance</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {phases.map((phase) => (
            <TableRow key={phase.phaseId}>
              <TableCell className="font-medium">{phase.phaseName}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(phase.estimatedCost)}
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
              {floatBalance !== undefined && <TableCell />}
            </TableRow>
          ))}

          <TableRow className="font-bold border-t-2">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">
              {formatCurrency(totals.estimated)}
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
            {floatBalance !== undefined && (
              <TableCell className="text-right text-blue-600">
                {formatCurrency(floatBalance)}
              </TableCell>
            )}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}