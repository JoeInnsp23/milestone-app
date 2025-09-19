'use client';

import { useState, useTransition } from 'react';
import { createEstimate, updateEstimate, deleteEstimate } from '@/app/(authenticated)/projects/[id]/actions/estimates';
import { ProjectEstimate } from '@/types';

interface ProjectEstimatesProps {
  projectId: string;
  estimates: ProjectEstimate[];
}

export function ProjectEstimates({ projectId, estimates: initialEstimates }: ProjectEstimatesProps) {
  const [estimates, setEstimates] = useState(initialEstimates);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<ProjectEstimate | null>(null);
  const [deletingEstimate, setDeletingEstimate] = useState<ProjectEstimate | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

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
      case 'hours':
        return '#3b82f6';
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
    const optimisticEstimate: ProjectEstimate = {
      id: editingEstimate?.id || tempId,
      project_id: projectId,
      description: formData.get('description') as string,
      estimate_type: formData.get('estimate_type') as 'revenue' | 'cost' | 'hours' | 'materials',
      amount: cleanedAmount,
      estimate_date: formData.get('estimate_date') as string,
      confidence_level: Number(formData.get('confidence_level')),
      notes: formData.get('notes') as string,
      build_phase_id: null,
      created_by: 'current-user',
      created_at: new Date().toISOString(),
      updated_by: null,
      updated_at: null,
    };

    // Optimistic update
    const previousEstimates = [...estimates];
    const idToTrack = editingEstimate?.id || tempId;

    if (editingEstimate) {
      setEstimates(estimates.map(e =>
        e.id === editingEstimate.id ? { ...e, ...optimisticEstimate, id: editingEstimate.id } : e
      ));
    } else {
      setEstimates([...estimates, optimisticEstimate]);
    }
    setIsCreateOpen(false);
    setEditingEstimate(null);

    // Mark as pending
    setPendingIds(prev => new Set(prev).add(idToTrack));

    startTransition(async () => {
      let result;
      if (editingEstimate) {
        result = await updateEstimate(editingEstimate.id, formData);
      } else {
        result = await createEstimate(formData);
      }

      if (result.success && result.estimate) {
        // Replace optimistic with real data
        if (editingEstimate) {
          setEstimates(estimates.map(e =>
            e.id === editingEstimate.id ? result.estimate! : e
          ));
        } else {
          setEstimates(prevEstimates =>
            prevEstimates.map(e => e.id === tempId ? result.estimate! : e)
          );
        }
      } else {
        // Rollback on error
        setEstimates(previousEstimates);
        alert(result.error || 'Failed to save estimate');
        // Reopen form with data
        if (!editingEstimate) {
          setIsCreateOpen(true);
        } else {
          setEditingEstimate(editingEstimate);
          setIsCreateOpen(true);
        }
      }
      // Clear pending state
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
    hours: estimates.filter(e => e.estimate_type === 'hours').reduce((sum, e) => {
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
      {/* Summary Cards */}
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

      {/* Add Estimate Button */}
      <div className="estimates-header">
        <h3>Project Estimates</h3>
        <button
          className="add-button"
          onClick={() => {
            setEditingEstimate(null);
            setIsCreateOpen(true);
          }}
        >
          + Add Estimate
        </button>
      </div>

      {/* Estimates List */}
      {estimates.length === 0 ? (
        <div className="empty-state">
          <p>No estimates added yet. Click &quot;Add Estimate&quot; to create your first estimate.</p>
        </div>
      ) : (
        <div className="estimates-list">
          {estimates.map((estimate) => {
            const isPending = pendingIds.has(estimate.id);
            return (
            <div
              key={estimate.id}
              className="estimate-card"
              style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.3s' }}
            >
              <div className="estimate-header">
                <span
                  className="estimate-type"
                  style={{ backgroundColor: getTypeColor(estimate.estimate_type) }}
                >
                  {estimate.estimate_type}
                </span>
                <div className="estimate-actions">
                  <button
                    className="action-button edit"
                    onClick={() => {
                      setEditingEstimate(estimate);
                      setIsCreateOpen(true);
                    }}
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
              </div>
              <div className="estimate-content">
                <div className="estimate-description">{estimate.description}</div>
                <div className="estimate-amount">
                  {estimate.estimate_type === 'hours'
                    ? `${estimate.amount} hours`
                    : formatCurrency(estimate.amount)}
                </div>
                {estimate.notes && (
                  <div className="estimate-notes">{estimate.notes}</div>
                )}
                <div className="estimate-meta">
                  Date: {formatDate(estimate.estimate_date)}
                  {estimate.confidence_level && (
                    <> • Confidence: {estimate.confidence_level}/5</>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
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
                    <option value="hours">Hours</option>
                    <option value="materials">Materials</option>
                  </select>
                </div>

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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="estimate_date">Date *</label>
                  <input
                    type="date"
                    id="estimate_date"
                    name="estimate_date"
                    defaultValue={editingEstimate?.estimate_date ? (typeof editingEstimate.estimate_date === 'string' ? editingEstimate.estimate_date.split('T')[0] : new Date(editingEstimate.estimate_date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]}
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
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingEstimate(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button" disabled={isPending}>
                  {isPending ? 'Saving...' : editingEstimate ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEstimate && (
        <div className="modal-overlay" onClick={() => setDeletingEstimate(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Estimate</h2>
            <p>Are you sure you want to delete this estimate?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="form-actions">
              <button
                className="cancel-button"
                onClick={() => setDeletingEstimate(null)}
              >
                Cancel
              </button>
              <button
                className="delete-button"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .estimates-section {
          padding: 0;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
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

        .estimates-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .estimates-header h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .add-button {
          padding: 8px 16px;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .add-button:hover {
          background: hsl(var(--primary) / 0.9);
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        .estimates-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .estimate-card {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
        }

        .estimate-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .estimate-type {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .estimate-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
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

        .estimate-description {
          font-weight: 500;
          margin-bottom: 8px;
        }

        .estimate-amount {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .estimate-notes {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .estimate-meta {
          font-size: 12px;
          color: var(--text-secondary);
        }

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
          background: hsl(var(--background));
          color: hsl(var(--foreground));
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

        .cancel-button {
          padding: 8px 16px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--muted));
          color: hsl(var(--muted-foreground));
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-button:hover {
          background: hsl(var(--muted) / 0.8);
        }

        .submit-button {
          padding: 8px 16px;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          background: hsl(var(--primary) / 0.9);
        }

        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delete-modal {
          max-width: 400px;
        }

        .delete-warning {
          color: var(--negative);
          font-size: 14px;
          margin-top: 8px;
        }

        .delete-button {
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .delete-button:hover:not(:disabled) {
          background: #dc2626;
        }

        .delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}