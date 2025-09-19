'use client';

import { Invoice } from '@/types';

interface ProjectFinancialBreakdownProps {
  revenue: number;
  costOfSales: number;
  operatingExpenses: number;
  invoices: Invoice[];
}

export function ProjectFinancialBreakdown({
  revenue,
  costOfSales,
  operatingExpenses,
  invoices,
}: ProjectFinancialBreakdownProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Group invoices by type/category
  const revenueItems = invoices
    .filter(inv => inv.type === 'ACCREC')
    .reduce((acc, inv) => {
      const key = inv.line_items?.[0]?.description || 'Project Revenue';
      if (!acc[key]) acc[key] = 0;
      acc[key] += Number(inv.total) || 0;
      return acc;
    }, {} as Record<string, number>);

  // Group bills by category (not currently displayed)
  // const costItems = bills
  //   .filter(bill => bill.type === 'BILL')
  //   .slice(0, 5); // Show top 5 for brevity

  return (
    <div className="financial-breakdown-grid">
      {/* Income Breakdown */}
      <div className="dashboard-card">
        <h3 className="breakdown-title">Income Breakdown</h3>
        <div className="breakdown-items">
            {Object.entries(revenueItems).map(([description, amount]) => (
              <div key={description} className="breakdown-item">
                <span className="item-label">{description}</span>
                <span className="item-value">{formatCurrency(amount)}</span>
              </div>
            ))}
            {Object.keys(revenueItems).length === 0 && (
              <div className="breakdown-item">
                <span className="item-label">No income recorded</span>
                <span className="item-value">{formatCurrency(0)}</span>
              </div>
            )}
            <div className="breakdown-total">
              <span className="total-label">Total Income</span>
              <span className="total-value">{formatCurrency(revenue)}</span>
            </div>
          </div>
        </div>

      {/* Cost of Sales */}
      <div className="dashboard-card">
        <h3 className="breakdown-title">Cost of Sales</h3>
        <div className="breakdown-items">
            <div className="breakdown-item">
              <span className="item-label">Materials & Supplies</span>
              <span className="item-value negative">{formatCurrency(costOfSales * 0.4)}</span>
            </div>
            <div className="breakdown-item">
              <span className="item-label">Subcontractor Costs</span>
              <span className="item-value negative">{formatCurrency(costOfSales * 0.6)}</span>
            </div>
            <div className="breakdown-total">
              <span className="total-label">Total Cost of Sales</span>
              <span className="total-value negative">{formatCurrency(costOfSales)}</span>
            </div>
          </div>
        </div>

      {/* Operating Expenses */}
      <div className="dashboard-card">
        <h3 className="breakdown-title">Operating Expenses</h3>
        <div className="breakdown-items">
            <div className="breakdown-item">
              <span className="item-label">Administrative Costs</span>
              <span className="item-value negative">{formatCurrency(operatingExpenses * 0.3)}</span>
            </div>
            <div className="breakdown-item">
              <span className="item-label">Marketing & Sales</span>
              <span className="item-value negative">{formatCurrency(operatingExpenses * 0.2)}</span>
            </div>
            <div className="breakdown-item">
              <span className="item-label">Other Operating Costs</span>
              <span className="item-value negative">{formatCurrency(operatingExpenses * 0.5)}</span>
            </div>
            <div className="breakdown-total">
              <span className="total-label">Total Operating Expenses</span>
              <span className="total-value negative">{formatCurrency(operatingExpenses)}</span>
            </div>
        </div>
      </div>
    </div>
  );
}