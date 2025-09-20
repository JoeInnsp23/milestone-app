'use client';

interface ProjectKPICardsProps {
  actualRevenue: number;
  actualCosts: number;
  estimatedRevenue: number;
  estimatedCosts: number;
  includeEstimates: boolean;
}

export function ProjectKPICards({
  actualRevenue,
  actualCosts,
  estimatedRevenue,
  estimatedCosts,
  includeEstimates,
}: ProjectKPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate totals based on toggle
  const totalIncome = includeEstimates ? actualRevenue + estimatedRevenue : actualRevenue;
  const totalCosts = includeEstimates ? actualCosts + estimatedCosts : actualCosts;

  // Calculate profits
  const grossProfit = totalIncome - (totalCosts * 0.6); // 60% as cost of sales
  const netProfit = totalIncome - totalCosts;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Check if there are any estimates
  const hasEstimates = estimatedRevenue > 0 || estimatedCosts > 0;

  return (
    <div className="stats-grid-3">
      <div className="stat-card">
        <div className="stat-label">TOTAL INCOME</div>
        <div className="stat-value">{formatCurrency(totalIncome)}</div>
        {includeEstimates && hasEstimates && (
          <div className="stat-subtitle" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>
            includes {formatCurrency(estimatedRevenue)} estimates
          </div>
        )}
        {!includeEstimates && hasEstimates && (
          <div className="stat-subtitle" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>
            actuals only
          </div>
        )}
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
        {includeEstimates && hasEstimates && (
          <div className="stat-subtitle" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>
            includes estimates
          </div>
        )}
        {!includeEstimates && hasEstimates && (
          <div className="stat-subtitle" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>
            actuals only
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
        {includeEstimates && hasEstimates && (
          <div className="stat-subtitle" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>
            includes {formatCurrency(estimatedRevenue - estimatedCosts)} est. profit
          </div>
        )}
        {!includeEstimates && hasEstimates && (
          <div className="stat-subtitle" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>
            actuals only
          </div>
        )}
      </div>
    </div>
  );
}