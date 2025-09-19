import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getDashboardStats, validateFinancialTotals as getFinancialTotals } from '@/lib/queries';

/**
 * DataValidator class for comprehensive data validation
 * Ensures data accuracy and consistency across the application
 */
export class DataValidator {
  /**
   * Validates that project counts match between database and displayed values
   */
  static async validateProjectCounts(): Promise<{
    isValid: boolean;
    actualProjects: number;
    displayedProjects: number;
    discrepancy?: string;
  }> {
    try {
      // Get actual project count from database
      const actualProjectCount = await db
        .select({ count: sql<number>`COUNT(DISTINCT id)` })
        .from(projects)
        .where(eq(projects.is_active, true));

      // Get displayed stats
      const displayedStats = await getDashboardStats();

      // Compare counts
      const actualCount = Number(actualProjectCount[0]?.count || 0);
      const displayedCount = Number(displayedStats.active_projects || 0);
      const isValid = actualCount === displayedCount;

      if (!isValid) {
        console.error(
          `[DataValidator] Project count mismatch: DB has ${actualCount} active projects, displaying ${displayedCount}`
        );
      }

      return {
        isValid,
        actualProjects: actualCount,
        displayedProjects: displayedCount,
        discrepancy: !isValid
          ? `Database shows ${actualCount} but UI displays ${displayedCount}`
          : undefined,
      };
    } catch (error) {
      console.error('[DataValidator] Error validating project counts:', error);
      return {
        isValid: false,
        actualProjects: 0,
        displayedProjects: 0,
        discrepancy: 'Failed to validate counts',
      };
    }
  }

  /**
   * Validates financial totals for accuracy
   */
  static async validateFinancialTotals(
    expectedRevenue: number,
    expectedCosts: number,
    expectedProfit: number,
    projectId?: string
  ): Promise<{
    isValid: boolean;
    discrepancies: string[];
  }> {
    try {
      const dbTotals = await getFinancialTotals(projectId);
      if (!dbTotals) {
        return {
          isValid: false,
          discrepancies: ['Unable to fetch financial totals from database'],
        };
      }

      const tolerance = 0.01; // Allow for small rounding differences
      const discrepancies: string[] = [];

      // Check revenue
      const actualRevenue = Number(dbTotals.total_revenue || 0);
      const revenueMatch = Math.abs(actualRevenue - expectedRevenue) < tolerance;
      if (!revenueMatch) {
        discrepancies.push(
          `Revenue mismatch: Expected £${expectedRevenue.toFixed(2)}, Actual £${actualRevenue.toFixed(2)}`
        );
      }

      // Check costs
      const actualCosts = Number(dbTotals.total_costs || 0);
      const costsMatch = Math.abs(actualCosts - expectedCosts) < tolerance;
      if (!costsMatch) {
        discrepancies.push(
          `Costs mismatch: Expected £${expectedCosts.toFixed(2)}, Actual £${actualCosts.toFixed(2)}`
        );
      }

      // Check profit
      const actualProfit = Number(dbTotals.total_profit || 0);
      const profitMatch = Math.abs(actualProfit - expectedProfit) < tolerance;
      if (!profitMatch) {
        discrepancies.push(
          `Profit mismatch: Expected £${expectedProfit.toFixed(2)}, Actual £${actualProfit.toFixed(2)}`
        );
      }

      const isValid = discrepancies.length === 0;

      if (!isValid) {
        console.warn('[DataValidator] Financial validation failed:', discrepancies);
      } else {
        console.log('[DataValidator] ✓ All financial calculations validated successfully');
      }

      return {
        isValid,
        discrepancies,
      };
    } catch (error) {
      console.error('[DataValidator] Error validating financial totals:', error);
      return {
        isValid: false,
        discrepancies: ['Failed to validate financial totals'],
      };
    }
  }

  /**
   * Runs all validations and returns a comprehensive report
   */
  static async runFullValidation(projectId?: string): Promise<{
    timestamp: Date;
    projectCounts: Awaited<ReturnType<typeof DataValidator.validateProjectCounts>>;
    financialTotals?: {
      isValid: boolean;
      discrepancies: string[];
    };
    overallValid: boolean;
  }> {
    const projectCounts = await this.validateProjectCounts();

    let financialTotals;
    if (projectId) {
      // If we have a project ID, we need expected values
      // This would typically come from the UI component
      console.log('[DataValidator] Project-specific validation requires expected values');
    }

    return {
      timestamp: new Date(),
      projectCounts,
      financialTotals,
      overallValid: projectCounts.isValid,
    };
  }

  /**
   * Validates data in development mode only
   */
  static async validateInDevelopment(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const validation = await this.runFullValidation();

    if (!validation.overallValid) {
      console.group('[DataValidator] Development Mode Validation Report');
      console.log('Timestamp:', validation.timestamp);
      console.log('Project Counts Valid:', validation.projectCounts.isValid);
      if (validation.projectCounts.discrepancy) {
        console.warn('Project Count Issue:', validation.projectCounts.discrepancy);
      }
      console.groupEnd();
    }
  }
}

export default DataValidator;