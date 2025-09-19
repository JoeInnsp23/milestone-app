'use client';

interface ProjectKPICardsProps {
  totalIncome: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export function ProjectKPICards({
  totalIncome,
  grossProfit,
  netProfit,
  profitMargin,
}: ProjectKPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="stats-grid-3">
      <div className="stat-card">
        <div className="stat-label">TOTAL INCOME</div>
        <div className="stat-value">{formatCurrency(totalIncome)}</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">GROSS PROFIT</div>
        <div className="stat-value" style={{ color: grossProfit >= 0 ? '#10b981' : '#ef4444' }}>
          {formatCurrency(grossProfit)}
        </div>
        {totalIncome > 0 && (
          <div className="stat-subtitle">
            {((grossProfit / totalIncome) * 100).toFixed(1)}% margin
          </div>
        )}
      </div>

      <div className="stat-card">
        <div className="stat-label">NET PROFIT</div>
        <div className="stat-value" style={{ color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
          {formatCurrency(netProfit)}
        </div>
        {totalIncome > 0 && (
          <div className="stat-subtitle">
            {profitMargin.toFixed(1)}% margin
          </div>
        )}
      </div>
    </div>
  );
}