'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { createEstimate, updateEstimate, deleteEstimate } from '@/app/(authenticated)/projects/[id]/actions/estimates';
import { ProjectEstimate } from '@/types';
import { Button } from '@/components/ui/button';

interface Phase {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  display_order?: number;
}

interface ProjectEstimatesProps {
  projectId: string;
  estimates: ProjectEstimate[];
  phases?: Phase[];
  openAddModal?: boolean;
  onAddModalClose?: () => void;
  isGrouped?: boolean;
}

export interface ProjectEstimatesHandle {
  openCreateModal: () => void;
}

export const ProjectEstimates = forwardRef<ProjectEstimatesHandle, ProjectEstimatesProps>(
  function ProjectEstimates(
    { projectId, estimates: initialEstimates, phases, openAddModal, onAddModalClose, isGrouped = false }: ProjectEstimatesProps,
    ref
  ) {
    const [estimates, setEstimates] = useState(initialEstimates);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<ProjectEstimate | null>(null);
    const [deletingEstimate, setDeletingEstimate] = useState<ProjectEstimate | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();
    const modalContainerRef = useRef<HTMLDivElement | null>(null);
    const previousBodyOverflowRef = useRef<string | null>(null);

    const openModal = (nextEditing: ProjectEstimate | null) => {
      setEditingEstimate(nextEditing);
      setIsCreateOpen(true);
    };

    useEffect(() => {
      if (typeof document === 'undefined') return;

      const container = document.createElement('div');
      container.className = 'project-estimates-modal-root';
      modalContainerRef.current = container;
      document.body.appendChild(container);

      return () => {
        document.body.removeChild(container);
        modalContainerRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (typeof document === 'undefined') return;

      if (isCreateOpen) {
        if (previousBodyOverflowRef.current === null) {
          previousBodyOverflowRef.current = document.body.style.overflow;
        }
        document.body.style.overflow = 'hidden';

        return () => {
          document.body.style.overflow = previousBodyOverflowRef.current ?? '';
          previousBodyOverflowRef.current = null;
        };
      }

      if (previousBodyOverflowRef.current !== null) {
        document.body.style.overflow = previousBodyOverflowRef.current;
        previousBodyOverflowRef.current = null;
      }

      return;
    }, [isCreateOpen]);

    useImperativeHandle(ref, () => ({
      openCreateModal: () => {
        openModal(null);
      },
    }));

    // Handle external trigger to open modal
    useEffect(() => {
      if (openAddModal) {
        openModal(null);
        onAddModalClose?.();
      }
    }, [openAddModal, onAddModalClose]);

    const formatCurrency = (value: number | string) => {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return '£0';
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue);
    };

    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('en-GB');
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'revenue':
          return '#10b981';
        case 'cost':
          return '#ef4444';
        case 'materials':
          return '#8b5cf6';
        default:
          return '#6b7280';
      }
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('project_id', projectId);

    // Clean the amount value (remove any non-numeric characters except .)
    const rawAmount = formData.get('amount') as string;
    const cleanedAmount = rawAmount.replace(/[^0-9.]/g, '');
    formData.set('amount', cleanedAmount);

    // Create optimistic estimate
    const tempId = `temp-${Date.now()}`;
    const editingTarget = editingEstimate;
    const optimisticEstimate: ProjectEstimate = {
      id: editingTarget?.id || tempId,
      project_id: projectId,
      description: formData.get('description') as string,
      estimate_type: formData.get('estimate_type') as 'revenue' | 'cost' | 'materials',
      amount: cleanedAmount,
      estimate_date: formData.get('estimate_date') as string,
      confidence_level: Number(formData.get('confidence_level')),
      notes: formData.get('notes') as string,
      build_phase_id: formData.get('build_phase_id') as string || null,
      created_by: 'current-user',
      created_at: new Date().toISOString(),
      updated_by: null,
      updated_at: null,
    };

    // Optimistic update
    const previousEstimates = [...estimates];
    const idToTrack = editingTarget?.id || tempId;

    if (editingTarget) {
      setEstimates((prev) =>
        prev.map((e) =>
          e.id === editingTarget.id ? { ...e, ...optimisticEstimate, id: editingTarget.id } : e
        )
      );
    } else {
      setEstimates((prev) => [...prev, optimisticEstimate]);
    }
    setIsCreateOpen(false);
    setEditingEstimate(null);

    // Mark as pending
    setPendingIds(prev => new Set(prev).add(idToTrack));

    startTransition(async () => {
      let result;
      if (editingTarget) {
        result = await updateEstimate(editingTarget.id, formData);
      } else {
        result = await createEstimate(formData);
      }

      if (result.success && result.estimate) {
        const resolvedEstimate = result.estimate;

        if (editingTarget) {
          setEstimates((prev) =>
            prev.map((e) => (e.id === editingTarget.id ? resolvedEstimate : e))
          );
        } else {
          setEstimates((prev) => {
            let replaced = false;
            const next = prev.map((e) => {
              if (e.id === tempId) {
                replaced = true;
                return resolvedEstimate;
              }
              return e;
            });
            return replaced ? next : [...next, resolvedEstimate];
          });
        }
      } else {
        // Rollback on error
        setEstimates(previousEstimates);
        alert(result.error || 'Failed to save estimate');
        // Reopen form with data
        if (!editingTarget) {
          openModal(null);
        } else {
          openModal(editingTarget);
        }
      }

      setPendingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(idToTrack);
        return newSet;
      });
    });
  };

  const handleDelete = async () => {
    if (!deletingEstimate) return;

    // Optimistic delete
    const previousEstimates = [...estimates];
    const deletedId = deletingEstimate.id;
    setEstimates(estimates.filter(e => e.id !== deletingEstimate.id));
    const deletedEstimate = deletingEstimate;
    setDeletingEstimate(null);

    // Mark as pending
    setPendingIds(prev => new Set(prev).add(deletedId));

    startTransition(async () => {
      const result = await deleteEstimate(deletedEstimate.id);
      if (!result.success) {
        // Rollback on error
        setEstimates(previousEstimates);
        alert(result.error || 'Failed to delete estimate');
      }
      // Clear pending state
      setPendingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletedId);
        return newSet;
      });
    });
  };

  // Group and calculate totals
    const totals = {
      revenue: estimates.filter(e => e.estimate_type === 'revenue').reduce((sum, e) => {
        const amount = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
        return sum + (amount || 0);
      }, 0),
      cost: estimates.filter(e => e.estimate_type === 'cost').reduce((sum, e) => {
        const amount = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
        return sum + (amount || 0);
      }, 0),
      materials: estimates.filter(e => e.estimate_type === 'materials').reduce((sum, e) => {
        const amount = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
        return sum + (amount || 0);
      }, 0),
    };

    const estimatedProfit = totals.revenue - totals.cost - totals.materials;
    const estimatedMargin = totals.revenue > 0 ? (estimatedProfit / totals.revenue) * 100 : 0;

    return (
      <div className="estimates-section">
      {/* Summary Cards - only show when not grouped */}
      {!isGrouped && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Est. Revenue</div>
            <div className="summary-value" style={{ color: '#10b981' }}>
              {formatCurrency(totals.revenue)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Est. Costs</div>
            <div className="summary-value" style={{ color: '#ef4444' }}>
              {formatCurrency(totals.cost + totals.materials)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Est. Profit</div>
            <div className="summary-value" style={{ color: estimatedProfit >= 0 ? '#3b82f6' : '#ef4444' }}>
              {formatCurrency(estimatedProfit)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Est. Margin</div>
            <div className="summary-value" style={{ color: '#8b5cf6' }}>
              {estimatedMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Estimates Table */}
      {estimates.length === 0 ? (
        <div className="empty-state">
          <p>No estimates added yet. Click &quot;Add Estimate&quot; to create your first estimate.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isGrouped ? "" : "bg-secondary text-sm"}>
              <tr>
                <th className={`text-left p-3 ${isGrouped ? 'uppercase text-xs font-semibold text-muted-foreground border-b-2 border-border' : ''}`}>Type</th>
                <th className={`text-left p-3 ${isGrouped ? 'uppercase text-xs font-semibold text-muted-foreground border-b-2 border-border' : ''}`}>Description</th>
                {!isGrouped && <th className="text-left p-2">Phase</th>}
                <th className={`text-right p-3 ${isGrouped ? 'uppercase text-xs font-semibold text-muted-foreground border-b-2 border-border' : ''}`}>Amount</th>
                <th className={`text-center p-3 ${isGrouped ? 'uppercase text-xs font-semibold text-muted-foreground border-b-2 border-border' : ''}`}>Date</th>
                <th className={`text-center p-3 ${isGrouped ? 'uppercase text-xs font-semibold text-muted-foreground border-b-2 border-border' : ''}`}>Confidence</th>
                <th className={`text-center p-3 ${isGrouped ? 'uppercase text-xs font-semibold text-muted-foreground border-b-2 border-border' : ''}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((estimate) => {
                const isPending = pendingIds.has(estimate.id);
                const phase = phases?.find(p => p.id === estimate.build_phase_id);
                return (
                  <tr
                    key={estimate.id}
                    className={`border-t ${isGrouped ? 'border-border' : ''} hover:bg-muted/30 transition-colors`}
                    style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.3s' }}
                  >
                    <td className="p-3 text-sm">
                      <span
                        className="estimate-type inline-block px-2 py-1 rounded text-xs font-semibold text-white uppercase"
                        style={{ backgroundColor: getTypeColor(estimate.estimate_type) }}
                      >
                        {estimate.estimate_type}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      <div className="font-medium">{estimate.description}</div>
                      {estimate.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{estimate.notes}</div>
                      )}
                    </td>
                    {!isGrouped && (
                      <td className="p-2">
                        {phase && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: phase.color || '#6B7280' }}
                            />
                            <span className="text-sm">{phase.name}</span>
                          </div>
                        )}
                      </td>
                    )}
                    <td className="p-3 text-right font-semibold text-sm">
                      {formatCurrency(estimate.amount)}
                    </td>
                    <td className="p-3 text-center text-sm">
                      {formatDate(estimate.estimate_date)}
                    </td>
                    <td className="p-3 text-center">
                      {estimate.confidence_level && (
                        <span className="text-sm text-muted-foreground">
                          {estimate.confidence_level}/5
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="action-button edit"
                          onClick={() => openModal(estimate)}
                        >
                          Edit
                        </button>
                        <button
                          className="action-button delete"
                          onClick={() => setDeletingEstimate(estimate)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Phase Subtotal Cards - only show when grouped */}
      {isGrouped && estimates.length > 0 && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Total Estimates</div>
            <div className="summary-value">
              {formatCurrency(totals.revenue + totals.cost + totals.materials)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Revenue</div>
            <div className="summary-value" style={{ color: '#10b981' }}>
              {formatCurrency(totals.revenue)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Costs</div>
            <div className="summary-value" style={{ color: '#ef4444' }}>
              {formatCurrency(totals.cost + totals.materials)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Net</div>
            <div className="summary-value" style={{ color: estimatedProfit >= 0 ? '#3b82f6' : '#ef4444' }}>
              {formatCurrency(estimatedProfit)}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isCreateOpen && modalContainerRef.current
        ? createPortal(
            <div
              className="modal-overlay"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingEstimate(null);
              }}
            >
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{editingEstimate ? 'Edit Estimate' : 'Create Estimate'}</h2>
                <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  defaultValue={editingEstimate?.description}
                  required
                  maxLength={500}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="estimate_type">Type *</label>
                  <select
                    id="estimate_type"
                    name="estimate_type"
                    defaultValue={editingEstimate?.estimate_type || 'revenue'}
                    required
                  >
                    <option value="revenue">Revenue</option>
                    <option value="cost">Cost</option>
                    <option value="materials">Materials</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="build_phase_id">Build Phase *</label>
                  <select
                    id="build_phase_id"
                    name="build_phase_id"
                    defaultValue={editingEstimate?.build_phase_id || ''}
                    required
                  >
                    <option value="">Select a phase...</option>
                    {phases?.sort((a, b) => (a.display_order || 999) - (b.display_order || 999)).map(phase => (
                      <option key={phase.id} value={phase.id}>
                        {phase.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="amount">Amount *</label>
                  <div className="amount-input-wrapper">
                    <span className="currency-symbol">£</span>
                    <input
                      type="text"
                      id="amount"
                      name="amount"
                      inputMode="decimal"
                      pattern="^\d+(\.\d{0,2})?$"
                      placeholder="0.00"
                      defaultValue={editingEstimate?.amount}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="estimate_date">Date *</label>
                  <input
                    type="date"
                    id="estimate_date"
                    name="estimate_date"
                    defaultValue={
                      editingEstimate?.estimate_date
                        ? new Date(editingEstimate.estimate_date).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0]
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confidence_level">Confidence Level</label>
                  <select
                    id="confidence_level"
                    name="confidence_level"
                    defaultValue={editingEstimate?.confidence_level || '3'}
                  >
                    <option value="1">1 - Very Low</option>
                    <option value="2">2 - Low</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - High</option>
                    <option value="5">5 - Very High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={editingEstimate?.notes || ''}
                />
              </div>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingEstimate(null);
                  }}
                  disabled={isPending}
                  className="cancel-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : editingEstimate ? 'Update' : 'Create'}
                </Button>
              </div>
                </form>
              </div>
            </div>,
            modalContainerRef.current
          )
        : null}

      {/* Delete Confirmation Modal */}
      {deletingEstimate && (
        <div className="modal-overlay" onClick={() => setDeletingEstimate(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Estimate</h2>
            <p>Are you sure you want to delete this estimate?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="form-actions">
              <Button
                variant="outline"
                onClick={() => setDeletingEstimate(null)}
                disabled={isPending}
                className="cancel-button"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .estimates-section {
          padding: 0;
        }

        .estimates-section .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 24px;
        }

        .estimates-section > .summary-cards:first-child {
          margin-top: 0;
          margin-bottom: 24px;
        }

        .summary-card {
          padding: 16px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .summary-label {
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .summary-value {
          font-size: 20px;
          font-weight: 700;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        /* Remove old card styles - now using table layout */

        .action-button {
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
          border: none;
          background: none;
        }

        .action-button.edit {
          background: hsl(var(--primary) / 0.1);
          color: hsl(var(--primary));
          border: 1px solid hsl(var(--primary) / 0.3);
        }

        .action-button.edit:hover {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }

        .action-button.delete {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .action-button.delete:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        /* Remove old estimate content styles - now using table cells */

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border-radius: 8px;
          padding: 24px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid hsl(var(--border));
        }

        .modal-content h2 {
          margin-bottom: 20px;
          color: hsl(var(--foreground));
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid hsl(var(--border));
          border-radius: 4px;
          font-size: 14px;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
        }

        :global(html.dark) .modal-content .form-group input,
        :global(html.dark) .modal-content .form-group select,
        :global(html.dark) .modal-content .form-group textarea {
          background: hsl(220 32% 12%);
          border-color: hsl(220 20% 24%);
        }

        /* Amount input with currency symbol */
        .amount-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .currency-symbol {
          position: absolute;
          left: 10px;
          color: hsl(var(--muted-foreground));
          font-weight: 500;
          pointer-events: none;
        }

        .amount-input-wrapper input {
          padding-left: 25px;
        }

        /* Remove number input spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"] {
          -moz-appearance: textfield;
        }

        /* Fix date picker calendar icon in dark mode */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
          opacity: 0.7;
        }

        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }

        /* Light mode - revert the invert */
        @media (prefers-color-scheme: light) {
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: none;
          }
        }

        /* Handle light theme class */
        :global(.light) input[type="date"]::-webkit-calendar-picker-indicator {
          filter: none;
        }

        /* Handle dark theme class */
        :global(.dark) input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .delete-modal {
          max-width: 400px;
        }

        .delete-warning {
          color: var(--negative);
          font-size: 14px;
          margin-top: 8px;
        }
      `}</style>

      </div>
    );
  }
);

ProjectEstimates.displayName = 'ProjectEstimates';
