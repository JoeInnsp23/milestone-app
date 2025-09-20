'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/export/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface CostTrackerItem {
  id: string;
  date: Date | string;
  invoiceReference: string;
  description: string;
  amountPaid: number;
  costsDirectByCustomer: number;
  refunds: number;
  costsDue: number;
  phaseId: string;
  phaseName: string;
}

interface CostTrackerTableProps {
  items: CostTrackerItem[];
}

export function CostTrackerTable({ items }: CostTrackerTableProps) {
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());

  // Group items by phase
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.phaseId]) {
      acc[item.phaseId] = {
        phaseName: item.phaseName,
        items: [],
        totals: { paid: 0, direct: 0, refunds: 0, due: 0 }
      };
    }
    acc[item.phaseId].items.push(item);
    acc[item.phaseId].totals.paid += item.amountPaid;
    acc[item.phaseId].totals.direct += item.costsDirectByCustomer;
    acc[item.phaseId].totals.refunds += item.refunds;
    acc[item.phaseId].totals.due += item.costsDue;
    return acc;
  }, {} as Record<string, {
    phaseName: string;
    items: CostTrackerItem[];
    totals: { paid: number; direct: number; refunds: number; due: number };
  }>);

  const togglePhase = (phaseId: string) => {
    const newCollapsed = new Set(collapsedPhases);
    if (newCollapsed.has(phaseId)) {
      newCollapsed.delete(phaseId);
    } else {
      newCollapsed.add(phaseId);
    }
    setCollapsedPhases(newCollapsed);
  };

  // Calculate grand totals
  const grandTotals = Object.values(groupedItems).reduce(
    (acc, phaseData) => ({
      paid: acc.paid + phaseData.totals.paid,
      direct: acc.direct + phaseData.totals.direct,
      refunds: acc.refunds + phaseData.totals.refunds,
      due: acc.due + phaseData.totals.due,
    }),
    { paid: 0, direct: 0, refunds: 0, due: 0 }
  );

  return (
    <div className="space-y-4">
      {Object.entries(groupedItems).map(([phaseId, phaseData]) => {
        const isCollapsed = collapsedPhases.has(phaseId);

        return (
          <div key={phaseId} className="border rounded-lg overflow-hidden">
            <div
              className="bg-muted p-4 cursor-pointer flex justify-between items-center hover:bg-muted/80 transition-colors"
              onClick={() => togglePhase(phaseId)}
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <h3 className="font-semibold">{phaseData.phaseName}</h3>
                <span className="text-sm text-muted-foreground">
                  ({phaseData.items.length} items)
                </span>
              </div>

              <div className="flex gap-6 text-sm">
                <span>Paid: <span className="font-medium">{formatCurrency(phaseData.totals.paid)}</span></span>
                <span>Due: <span className="font-medium">{formatCurrency(phaseData.totals.due)}</span></span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary text-sm">
                    <tr>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Invoice Ref</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Amount Paid</th>
                      <th className="text-right p-2">Direct By Customer</th>
                      <th className="text-right p-2">Refunds</th>
                      <th className="text-right p-2">Costs Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phaseData.items.map((item: CostTrackerItem) => (
                      <tr key={item.id} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="p-2">
                          {format(new Date(item.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="p-2">{item.invoiceReference}</td>
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-right">{formatCurrency(item.amountPaid)}</td>
                        <td className="p-2 text-right">{formatCurrency(item.costsDirectByCustomer)}</td>
                        <td className="p-2 text-right">{formatCurrency(item.refunds)}</td>
                        <td className="p-2 text-right">{formatCurrency(item.costsDue)}</td>
                      </tr>
                    ))}

                    <tr className="border-t-2 font-semibold bg-secondary">
                      <td colSpan={3} className="p-2">Phase Subtotal</td>
                      <td className="p-2 text-right">{formatCurrency(phaseData.totals.paid)}</td>
                      <td className="p-2 text-right">{formatCurrency(phaseData.totals.direct)}</td>
                      <td className="p-2 text-right">{formatCurrency(phaseData.totals.refunds)}</td>
                      <td className="p-2 text-right">{formatCurrency(phaseData.totals.due)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Grand Total */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-primary/10 p-4">
          <table className="w-full">
            <tbody>
              <tr className="font-bold text-lg">
                <td className="p-2">Grand Total</td>
                <td className="p-2 text-right">Paid: {formatCurrency(grandTotals.paid)}</td>
                <td className="p-2 text-right">Direct: {formatCurrency(grandTotals.direct)}</td>
                <td className="p-2 text-right">Refunds: {formatCurrency(grandTotals.refunds)}</td>
                <td className="p-2 text-right">Due: {formatCurrency(grandTotals.due)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}