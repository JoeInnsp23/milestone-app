'use client';

import { Ref, useState, useMemo } from 'react';
import { ProjectInvoices } from './project-invoices';
import { ProjectBills } from './project-bills';
import { ProjectEstimates, ProjectEstimatesHandle } from './project-estimates';
import { PhaseSummaryTable } from './phase-summary-table';
import { CostTrackerTable } from './cost-tracker-table';
import { Invoice, Bill, ProjectEstimate } from '@/types';
import { formatCurrency } from '@/lib/export/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Phase {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  display_order?: number;
}

interface ProjectTabsEnhancedProps {
  projectId: string;
  invoices: Invoice[];
  bills: Bill[];
  estimates: ProjectEstimate[];
  phases: Phase[];
  phaseSummaries?: Array<{
    id: string;
    name: string;
    color?: string;
    icon?: string;
    projectId: string;
    progress: number;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    itemCount: number;
  }>;
  projects: Array<{ id: string; name: string }>;
  activeTab?: 'summary' | 'cost-tracker' | 'invoices' | 'bills' | 'estimates';
  onTabChange?: (tab: 'summary' | 'cost-tracker' | 'invoices' | 'bills' | 'estimates') => void;
  estimatesRef?: Ref<ProjectEstimatesHandle>;
}

interface GroupedItem<T> {
  phase: Phase | null;
  items: T[];
  subtotal: number;
}

export function ProjectTabsEnhanced({
  projectId,
  invoices,
  bills,
  estimates,
  phases,
  phaseSummaries,
  // projects, // Not used currently
  activeTab,
  onTabChange,
  estimatesRef,
}: ProjectTabsEnhancedProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'summary' | 'cost-tracker' | 'invoices' | 'bills' | 'estimates'>('summary');
  const [groupByPhase, setGroupByPhase] = useState(true);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  const currentTab = activeTab ?? internalActiveTab;

  const handleTabChange = (tab: 'summary' | 'cost-tracker' | 'invoices' | 'bills' | 'estimates') => {
    if (tab === currentTab) return;

    if (onTabChange) {
      onTabChange(tab);
    }

    if (activeTab === undefined) {
      setInternalActiveTab(tab);
    }
  };

  const togglePhase = (phaseId: string) => {
    const newCollapsed = new Set(collapsedPhases);
    if (newCollapsed.has(phaseId)) {
      newCollapsed.delete(phaseId);
    } else {
      newCollapsed.add(phaseId);
    }
    setCollapsedPhases(newCollapsed);
  };

  const groupItemsByPhase = <T extends { build_phase_id?: string | null }>(
    items: T[],
    getAmount: (item: T) => number
  ): GroupedItem<T>[] => {
    if (!groupByPhase) {
      return [{
        phase: null,
        items: items.sort((a, b) => {
          // Complex type due to mixed item types with different date fields
          const getDate = (item: T & { invoice_date?: Date | string | null; bill_date?: Date | string | null; estimate_date?: Date | string | null; created_at?: Date | string | null }) => {
            return item.invoice_date || item.bill_date || item.estimate_date || item.created_at || new Date();
          };
          const dateA = new Date(getDate(a as T & { invoice_date?: Date | string | null; bill_date?: Date | string | null; estimate_date?: Date | string | null; created_at?: Date | string | null })).getTime();
          const dateB = new Date(getDate(b as T & { invoice_date?: Date | string | null; bill_date?: Date | string | null; estimate_date?: Date | string | null; created_at?: Date | string | null })).getTime();
          return dateB - dateA; // Descending order
        }),
        subtotal: items.reduce((sum, item) => sum + getAmount(item), 0)
      }];
    }

    const grouped = new Map<string, GroupedItem<T>>();

    // Group unassigned items
    const unassigned = items.filter(item => !item.build_phase_id);
    if (unassigned.length > 0) {
      grouped.set('unassigned', {
        phase: null,
        items: unassigned,
        subtotal: unassigned.reduce((sum, item) => sum + getAmount(item), 0)
      });
    }

    // Group items by phase
    phases.forEach(phase => {
      const phaseItems = items.filter(item => item.build_phase_id === phase.id);
      if (phaseItems.length > 0) {
        grouped.set(phase.id, {
          phase,
          items: phaseItems,
          subtotal: phaseItems.reduce((sum, item) => sum + getAmount(item), 0)
        });
      }
    });

    return Array.from(grouped.values());
  };

  const renderGroupedItems = <T extends { id: string }>(
    items: T[],
    groups: GroupedItem<T>[],
    renderItem: (item: T) => React.ReactNode
  ) => {
    if (!groupByPhase) {
      return (
        <div className="space-y-2 p-4">
          {groups[0]?.items.map(renderItem)}
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        {groups.map((group) => {
          const phaseId = group.phase?.id || 'unassigned';
          const isCollapsed = collapsedPhases.has(phaseId);

          return (
            <div key={phaseId} className="border rounded-lg overflow-hidden">
              <div
                className="bg-muted p-3 cursor-pointer flex justify-between items-center"
                onClick={() => togglePhase(phaseId)}
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {group.phase && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.phase.color }}
                    />
                  )}
                  <span className="font-medium">
                    {group.phase?.name || 'Unassigned'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({group.items.length} items)
                  </span>
                </div>

                <span className="font-medium">
                  {formatCurrency(group.subtotal)}
                </span>
              </div>

              {!isCollapsed && (
                <div className="p-3 space-y-2 bg-background">
                  {group.items.map(renderItem)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getInvoiceAmount = (invoice: Invoice) => Number(invoice.total || 0);
  const getBillAmount = (bill: Bill) => Number(bill.total || 0);
  const getEstimateAmount = (estimate: ProjectEstimate) => Number(estimate.amount || 0);

  const groupedInvoices = groupItemsByPhase(invoices, getInvoiceAmount);
  const groupedBills = groupItemsByPhase(bills, getBillAmount);
  const groupedEstimates = groupItemsByPhase(estimates, getEstimateAmount);

  // Prepare data for Summary and Cost Tracker tabs
  const phaseSummaryData = useMemo(() => {
    // ALWAYS use all 17 phases as the base
    const allPhasesData = [
      { id: 'BP001', name: 'Demolition Enabling works', color: '#8B4513', icon: 'Hammer', display_order: 1 },
      { id: 'BP002', name: 'Groundworks', color: '#8B5A2B', icon: 'Shovel', display_order: 2 },
      { id: 'BP003', name: 'Masonry', color: '#A0522D', icon: 'Layers', display_order: 3 },
      { id: 'BP004', name: 'Roofing', color: '#708090', icon: 'Home', display_order: 4 },
      { id: 'BP005', name: 'Electrical', color: '#FFD700', icon: 'Zap', display_order: 5 },
      { id: 'BP006', name: 'Plumbing & Heating', color: '#4682B4', icon: 'Droplets', display_order: 6 },
      { id: 'BP007', name: 'Joinery', color: '#8B7355', icon: 'Hammer', display_order: 7 },
      { id: 'BP008', name: 'Windows and doors', color: '#87CEEB', icon: 'DoorOpen', display_order: 8 },
      { id: 'BP009', name: 'Drylining & Plaster/Render', color: '#F5F5DC', icon: 'PaintRoller', display_order: 9 },
      { id: 'BP010', name: 'Decoration', color: '#9370DB', icon: 'Paintbrush', display_order: 10 },
      { id: 'BP011', name: 'Landscaping', color: '#228B22', icon: 'Trees', display_order: 11 },
      { id: 'BP012', name: 'Finishes Schedule', color: '#DAA520', icon: 'ListChecks', display_order: 12 },
      { id: 'BP013', name: 'Steelwork', color: '#696969', icon: 'HardHat', display_order: 13 },
      { id: 'BP014', name: 'Flooring/Tiling', color: '#D2691E', icon: 'Grid3x3', display_order: 14 },
      { id: 'BP015', name: 'Kitchen', color: '#FF6347', icon: 'ChefHat', display_order: 15 },
      { id: 'BP016', name: 'Extra', color: '#6B7280', icon: 'Plus', display_order: 16 },
      { id: 'BP017', name: 'Project Management Fee', color: '#4B0082', icon: 'Briefcase', display_order: 17 },
    ];

    // Create a map of phase summaries if available
    const summariesMap = new Map(phaseSummaries?.map(p => [p.id, p]) || []);
    // Merge any data from passed phases (for updated names, colors, etc)
    const phasesMap = new Map(phases.map(p => [p.id, p]));

    return allPhasesData.map(phase => {
      const dbPhase = phasesMap.get(phase.id);
      const phaseSummary = summariesMap.get(phase.id);
      // Use data from DB if available, otherwise use hardcoded defaults
      const finalPhase = dbPhase ? { ...phase, ...dbPhase } : phase;

      const phaseBills = bills.filter(bill => bill.build_phase_id === finalPhase.id);
      const phaseInvoices = invoices.filter(inv => inv.build_phase_id === finalPhase.id);
      const phaseEstimates = estimates.filter(est => est.build_phase_id === finalPhase.id);

      // Calculate estimated amounts
      const estimatedRevenue = phaseEstimates
        .filter(est => est.estimate_type === 'revenue')
        .reduce((sum, est) => sum + Number(est.amount || 0), 0);

      const estimatedCost = phaseEstimates
        .filter(est => est.estimate_type === 'cost' || est.estimate_type === 'materials')
        .reduce((sum, est) => sum + Number(est.amount || 0), 0);

      // Calculate actual amounts
      const actualRevenue = phaseInvoices
        .filter(inv => inv.type === 'ACCREC')
        .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

      const actualCosts = phaseBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);

      // Calculate payment status
      const totalPaidToDate = phaseBills
        .filter(bill => bill.status === 'PAID')
        .reduce((sum, bill) => sum + Number(bill.amount_paid || 0), 0);

      const costsDue = phaseBills
        .filter(bill => bill.status !== 'PAID')
        .reduce((sum, bill) => sum + Number(bill.amount_due || 0), 0);

      const variance = estimatedCost - actualCosts;

      // Calculate progress (based on paid vs estimated)
      const progress = estimatedCost > 0
        ? Math.round((totalPaidToDate / estimatedCost) * 100)
        : 0;

      return {
        phaseId: finalPhase.id,
        phaseName: finalPhase.name,
        phaseColor: finalPhase.color,
        estimatedRevenue,
        estimatedCost,
        actualRevenue,
        actualCosts,
        totalPaidToDate,
        costsDue,
        variance,
        progress: phaseSummary?.progress || progress
      };
    });
  }, [phases, phaseSummaries, bills, invoices, estimates]);

  const costTrackerData = useMemo(() => {
    const items: Array<{
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
      phaseOrder: number;
    }> = [];

    // Create a map of phase orders using the same hardcoded list as summary
    const phaseOrderMap = new Map([
      ['BP001', 1], ['BP002', 2], ['BP003', 3], ['BP004', 4],
      ['BP005', 5], ['BP006', 6], ['BP007', 7], ['BP008', 8],
      ['BP009', 9], ['BP010', 10], ['BP011', 11], ['BP012', 12],
      ['BP013', 13], ['BP014', 14], ['BP015', 15], ['BP016', 16],
      ['BP017', 17]
    ]);

    // Combine bills and invoices for cost tracking
    bills.forEach(bill => {
      const phase = phases.find(p => p.id === bill.build_phase_id);
      const phaseOrder = phaseOrderMap.get(bill.build_phase_id || '') || 999;
      items.push({
        id: bill.id,
        date: bill.bill_date || bill.created_at || new Date(),
        invoiceReference: bill.bill_number || 'N/A',
        description: bill.contact_name || 'Bill',
        amountPaid: Number(bill.amount_paid || 0),
        costsDirectByCustomer: 0,
        refunds: 0,
        costsDue: Number(bill.amount_due || 0),
        phaseId: bill.build_phase_id || 'unassigned',
        phaseName: phase?.name || 'Unassigned',
        phaseOrder
      });
    });

    // Sort by phase order first, then by date within each phase
    return items.sort((a, b) => {
      if (a.phaseOrder !== b.phaseOrder) {
        return a.phaseOrder - b.phaseOrder;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [bills, phases]);

  return (
    <div className="dashboard-card">
      <div className="flex justify-between items-center mb-4">
        <div className="tabs-header">
          <button
            className={`tab-button ${currentTab === 'summary' ? 'active' : ''}`}
            onClick={() => handleTabChange('summary')}
          >
            Summary
          </button>
          <button
            className={`tab-button ${currentTab === 'cost-tracker' ? 'active' : ''}`}
            onClick={() => handleTabChange('cost-tracker')}
          >
            Cost Tracker
          </button>
          <button
            className={`tab-button ${currentTab === 'invoices' ? 'active' : ''}`}
            onClick={() => handleTabChange('invoices')}
          >
            Invoices ({invoices.length})
          </button>
          <button
            className={`tab-button ${currentTab === 'bills' ? 'active' : ''}`}
            onClick={() => handleTabChange('bills')}
          >
            Bills ({bills.length})
          </button>
          <button
            className={`tab-button ${currentTab === 'estimates' ? 'active' : ''}`}
            onClick={() => handleTabChange('estimates')}
          >
            Estimates ({estimates.length})
          </button>
        </div>

        {(currentTab === 'invoices' || currentTab === 'bills' || currentTab === 'estimates') && (
          <div className="flex items-center gap-2">
            <Switch
              id="group-by-phase"
              checked={groupByPhase}
              onCheckedChange={setGroupByPhase}
            />
            <Label htmlFor="group-by-phase" className="text-sm font-medium cursor-pointer">
              Group by Phase
            </Label>
          </div>
        )}
      </div>

      <div className="tab-content">
        {currentTab === 'summary' && (
          <PhaseSummaryTable
            phases={phaseSummaryData}
          />
        )}

        {currentTab === 'cost-tracker' && (
          <CostTrackerTable items={costTrackerData} />
        )}

        {currentTab === 'invoices' && (
          groupByPhase ? (
            renderGroupedItems(
              invoices,
              groupedInvoices,
              (invoice) => <ProjectInvoices key={invoice.id} invoices={[invoice]} />
            )
          ) : (
            <ProjectInvoices invoices={invoices} />
          )
        )}

        {currentTab === 'bills' && (
          groupByPhase ? (
            renderGroupedItems(
              bills,
              groupedBills,
              (bill) => <ProjectBills key={bill.id} bills={[bill]} />
            )
          ) : (
            <ProjectBills bills={bills} />
          )
        )}

        {currentTab === 'estimates' && (
          groupByPhase ? (
            renderGroupedItems(
              estimates,
              groupedEstimates,
              (estimate) => (
                <div key={estimate.id}>
                  {/* Render individual estimate */}
                  <ProjectEstimates
                    ref={estimatesRef}
                    projectId={projectId}
                    estimates={[estimate]}
                  />
                </div>
              )
            )
          ) : (
            <ProjectEstimates
              ref={estimatesRef}
              projectId={projectId}
              estimates={estimates}
            />
          )
        )}
      </div>
    </div>
  );
}