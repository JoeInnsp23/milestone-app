'use client';

import { Ref, useState } from 'react';
import { ProjectInvoices } from './project-invoices';
import { ProjectBills } from './project-bills';
import { ProjectEstimates, ProjectEstimatesHandle } from './project-estimates';
import { Invoice, Bill, ProjectEstimate, BuildPhase } from '@/types';
import { formatCurrency } from '@/lib/export/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ProjectTabsEnhancedProps {
  projectId: string;
  invoices: Invoice[];
  bills: Bill[];
  estimates: ProjectEstimate[];
  phases: any[];
  projects: any[];
  activeTab?: 'invoices' | 'bills' | 'estimates';
  onTabChange?: (tab: 'invoices' | 'bills' | 'estimates') => void;
  estimatesRef?: Ref<ProjectEstimatesHandle>;
}

interface GroupedItem<T> {
  phase: any | null;
  items: T[];
  subtotal: number;
}

export function ProjectTabsEnhanced({
  projectId,
  invoices,
  bills,
  estimates,
  phases,
  projects,
  activeTab,
  onTabChange,
  estimatesRef,
}: ProjectTabsEnhancedProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'invoices' | 'bills' | 'estimates'>('estimates');
  const [groupByPhase, setGroupByPhase] = useState(true);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  const currentTab = activeTab ?? internalActiveTab;

  const handleTabChange = (tab: 'invoices' | 'bills' | 'estimates') => {
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
          const getDate = (item: any) => {
            return item.invoice_date || item.bill_date || item.estimate_date || item.created_at;
          };
          const dateA = new Date(getDate(a)).getTime();
          const dateB = new Date(getDate(b)).getTime();
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

  return (
    <div className="dashboard-card">
      <div className="flex justify-between items-center mb-4">
        <div className="tabs-header">
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
      </div>

      <div className="tab-content">
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