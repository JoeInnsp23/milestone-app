'use client';

import { useFinancialValidation, useProjectCountValidation } from '@/hooks/useDataValidation';

interface DashboardValidatorProps {
  expectedRevenue: number;
  expectedCosts: number;
  expectedProfit: number;
  children: React.ReactNode;
}

export function DashboardValidator({
  expectedRevenue,
  expectedCosts,
  expectedProfit,
  children
}: DashboardValidatorProps) {
  // Run validation hooks in development only
  useProjectCountValidation();
  useFinancialValidation(expectedRevenue, expectedCosts, expectedProfit);

  // Render children without modification
  return <>{children}</>;
}