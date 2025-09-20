// Server-side only validation utilities
// This file contains validation logic that should only run on the server
// It's used for development-time data integrity checks

import { validateDashboardData, validateFinancialTotals } from '@/lib/queries';

export async function runDashboardValidation(stats: {
  total_revenue: number;
  total_costs: number;
  total_profit: number;
  active_projects: number;
}) {
  if (process.env.NODE_ENV !== 'development') return;

  try {
    // Validate project counts
    const countValidation = await validateDashboardData();
    if (!countValidation.isValid) {
      console.warn('[Server Validation] Project count mismatch:', {
        database: countValidation.actualProjects,
        displayed: countValidation.displayedProjects,
      });
    } else {
      console.log(`[Server Validation] ✓ Project count matches: ${countValidation.actualProjects} projects`);
    }

    // Validate financial totals
    const financialValidation = await validateFinancialTotals();
    if (financialValidation) {
      const tolerance = 0.01; // Allow for small rounding differences
      const revenueMatch = Math.abs(Number(financialValidation.total_revenue || 0) - stats.total_revenue) < tolerance;
      const costsMatch = Math.abs(Number(financialValidation.total_costs || 0) - stats.total_costs) < tolerance;
      const profitMatch = Math.abs(Number(financialValidation.total_profit || 0) - stats.total_profit) < tolerance;

      if (!revenueMatch || !costsMatch || !profitMatch) {
        console.warn('[Server Validation] Financial mismatch detected:', {
          revenue: { expected: stats.total_revenue, actual: Number(financialValidation.total_revenue || 0), match: revenueMatch },
          costs: { expected: stats.total_costs, actual: Number(financialValidation.total_costs || 0), match: costsMatch },
          profit: { expected: stats.total_profit, actual: Number(financialValidation.total_profit || 0), match: profitMatch },
        });
      } else {
        console.log('[Server Validation] ✓ All financial calculations match');
      }
    }
  } catch (error) {
    console.error('[Server Validation] Error running dashboard validation:', error);
  }
}

export async function runProjectCountValidation(projectCount: number) {
  if (process.env.NODE_ENV !== 'development') return;

  try {
    const validation = await validateDashboardData();
    if (!validation.isValid) {
      console.error(
        `[Server Validation] Project count mismatch: DB has ${validation.actualProjects}, UI will show ${projectCount}`
      );
    } else {
      console.log(`[Server Validation] ✓ Project counts match: ${validation.actualProjects} projects`);
    }
  } catch (error) {
    console.error('[Server Validation] Error running project count validation:', error);
  }
}

export async function runProjectFinancialValidation(
  projectId: string,
  expectedRevenue: number,
  expectedCosts: number,
  expectedProfit: number
) {
  if (process.env.NODE_ENV !== 'development') return;

  try {
    const dbTotals = await validateFinancialTotals(projectId);
    if (!dbTotals) return;

    const tolerance = 0.01; // Allow for small rounding differences

    const revenueMatch = Math.abs(Number(dbTotals.total_revenue || 0) - expectedRevenue) < tolerance;
    const costsMatch = Math.abs(Number(dbTotals.total_costs || 0) - expectedCosts) < tolerance;
    const profitMatch = Math.abs(Number(dbTotals.total_profit || 0) - expectedProfit) < tolerance;

    if (!revenueMatch || !costsMatch || !profitMatch) {
      console.warn(`[Server Validation] Project ${projectId} financial mismatch:`, {
        revenue: { expected: expectedRevenue, actual: Number(dbTotals.total_revenue || 0), match: revenueMatch },
        costs: { expected: expectedCosts, actual: Number(dbTotals.total_costs || 0), match: costsMatch },
        profit: { expected: expectedProfit, actual: Number(dbTotals.total_profit || 0), match: profitMatch },
      });
    } else {
      console.log(`[Server Validation] ✓ Project ${projectId} financial calculations match`);
    }
  } catch (error) {
    console.error('[Server Validation] Error running project financial validation:', error);
  }
}