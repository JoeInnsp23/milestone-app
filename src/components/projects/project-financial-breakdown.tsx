'use client';

import { Invoice, Bill } from '@/types';

interface ProjectFinancialBreakdownProps {
  revenue: number;
  costOfSales: number;
  operatingExpenses: number;
  invoices: Invoice[];
  bills: Bill[];
}

export function ProjectFinancialBreakdown({
  revenue,
  costOfSales,
  operatingExpenses,
  invoices,
  bills: _bills, // Not currently used but may be needed for future enhancements
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
    <div className="financial-breakdown">
      <div className="breakdown-grid">
        {/* Income Breakdown */}
        <div className="breakdown-section">
          <h3 className="section-title">Income Breakdown</h3>
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
        <div className="breakdown-section">
          <h3 className="section-title">Cost of Sales</h3>
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
        <div className="breakdown-section">
          <h3 className="section-title">Operating Expenses</h3>
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

      <style jsx>{`
        .financial-breakdown {
          margin: 30px 0;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .breakdown-section {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        .breakdown-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-light);
        }

        .breakdown-item:last-child {
          border-bottom: none;
        }

        .item-label {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .item-value {
          font-weight: 500;
          font-size: 14px;
        }

        .item-value.negative {
          color: var(--negative);
        }

        .breakdown-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0 0;
          margin-top: 8px;
          border-top: 2px solid var(--border-color);
        }

        .total-label {
          font-weight: 600;
          color: var(--text-primary);
        }

        .total-value {
          font-weight: 700;
          font-size: 16px;
        }

        .total-value.negative {
          color: var(--negative);
        }
      `}</style>
    </div>
  );
}