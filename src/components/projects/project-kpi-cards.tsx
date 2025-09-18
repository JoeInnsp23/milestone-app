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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="kpi-grid" style={{ marginTop: '30px', marginBottom: '30px' }}>
      <div className="kpi-card">
        <div className="kpi-label">TOTAL INCOME</div>
        <div className="kpi-value">{formatCurrency(totalIncome)}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">GROSS PROFIT</div>
        <div className="kpi-value" style={{ color: grossProfit >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
          {formatCurrency(grossProfit)}
        </div>
        {grossProfit > 0 && totalIncome > 0 && (
          <div className="kpi-subtitle">
            {((grossProfit / totalIncome) * 100).toFixed(1)}% margin
          </div>
        )}
      </div>

      <div className="kpi-card">
        <div className="kpi-label">NET PROFIT</div>
        <div className="kpi-value" style={{ color: netProfit >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
          {formatCurrency(netProfit)}
        </div>
        {totalIncome > 0 && (
          <div className="kpi-subtitle">
            {profitMargin.toFixed(1)}% margin
          </div>
        )}
      </div>
    </div>
  );
}