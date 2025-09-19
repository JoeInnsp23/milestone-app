'use client';

import { useEffect } from 'react';
import { validateDashboardData, validateFinancialTotals } from '@/lib/queries';

export function useDataValidation(projectId?: string) {
  useEffect(() => {
    // Only run validation in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const runValidation = async () => {
      try {
        // Validate dashboard data accuracy
        const dashboardValidation = await validateDashboardData();
        if (!dashboardValidation.isValid) {
          console.warn('[Data Validation] Dashboard data mismatch detected:', {
            database: dashboardValidation.actualProjects,
            displayed: dashboardValidation.displayedProjects,
          });
        }

        // Validate financial totals
        const financialValidation = await validateFinancialTotals(projectId);
        if (financialValidation) {
          console.log('[Data Validation] Financial totals:', financialValidation);
        }
      } catch (error) {
        console.error('[Data Validation] Error running validation:', error);
      }
    };

    // Run validation after a short delay to ensure data is loaded
    const timer = setTimeout(runValidation, 1000);

    return () => clearTimeout(timer);
  }, [projectId]);
}

// Hook to validate project counts
export function useProjectCountValidation() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const validateCounts = async () => {
      const validation = await validateDashboardData();
      if (!validation.isValid) {
        console.error(
          `[Project Count Validation] Mismatch: DB has ${validation.actualProjects} projects, UI shows ${validation.displayedProjects}`
        );
      } else {
        console.log(`[Project Count Validation] ✓ Counts match: ${validation.actualProjects} projects`);
      }
    };

    validateCounts();
  }, []);
}

// Hook to validate financial calculations
export function useFinancialValidation(
  expectedRevenue: number,
  expectedCosts: number,
  expectedProfit: number,
  projectId?: string
) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const validateFinancials = async () => {
      const dbTotals = await validateFinancialTotals(projectId);
      if (!dbTotals) return;

      const tolerance = 0.01; // Allow for small rounding differences

      const revenueMatch = Math.abs(Number(dbTotals.total_revenue || 0) - expectedRevenue) < tolerance;
      const costsMatch = Math.abs(Number(dbTotals.total_costs || 0) - expectedCosts) < tolerance;
      const profitMatch = Math.abs(Number(dbTotals.total_profit || 0) - expectedProfit) < tolerance;

      if (!revenueMatch || !costsMatch || !profitMatch) {
        console.warn('[Financial Validation] Mismatch detected:', {
          revenue: { expected: expectedRevenue, actual: Number(dbTotals.total_revenue || 0), match: revenueMatch },
          costs: { expected: expectedCosts, actual: Number(dbTotals.total_costs || 0), match: costsMatch },
          profit: { expected: expectedProfit, actual: Number(dbTotals.total_profit || 0), match: profitMatch },
        });
      } else {
        console.log('[Financial Validation] ✓ All financial calculations match');
      }
    };

    const timer = setTimeout(validateFinancials, 1500);
    return () => clearTimeout(timer);
  }, [expectedRevenue, expectedCosts, expectedProfit, projectId]);
}