'use client';

import { format } from 'date-fns';
import { Invoice } from '@/types';

interface ProjectInvoicesProps {
  invoices: Invoice[];
}

export function ProjectInvoices({ invoices }: ProjectInvoicesProps) {
  const formatCurrency = (value: number | string | null) => {
    if (value === null) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(numValue);
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return '#6b7280';
    switch (status) {
      case 'PAID':
        return '#10b981';
      case 'AUTHORISED':
        return '#3b82f6';
      case 'DRAFT':
        return '#6b7280';
      case 'VOIDED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const salesInvoices = invoices.filter(inv => inv.type === 'ACCREC');

  if (salesInvoices.length === 0) {
    return (
      <div className="empty-state">
        <p>No invoices found for this project.</p>
      </div>
    );
  }

  return (
    <div className="invoices-table">
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Due Date</th>
            <th>Contact</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {salesInvoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.invoice_number}</td>
              <td>
                {invoice.invoice_date
                  ? format(new Date(invoice.invoice_date), 'dd/MM/yyyy')
                  : '-'}
              </td>
              <td>
                {invoice.due_date
                  ? format(new Date(invoice.due_date), 'dd/MM/yyyy')
                  : '-'}
              </td>
              <td>{invoice.contact_name || '-'}</td>
              <td>{formatCurrency(invoice.total)}</td>
              <td className="paid">{formatCurrency(invoice.amount_paid)}</td>
              <td className="due">{formatCurrency(invoice.amount_due)}</td>
              <td>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(invoice.status) }}
                >
                  {invoice.status || 'UNKNOWN'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">Total Invoiced</div>
          <div className="summary-value">
            {formatCurrency(salesInvoices.reduce((sum, inv) => sum + (typeof inv.total === 'string' ? parseFloat(inv.total) : (inv.total || 0)), 0))}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Paid</div>
          <div className="summary-value paid">
            {formatCurrency(salesInvoices.reduce((sum, inv) => sum + (typeof inv.amount_paid === 'string' ? parseFloat(inv.amount_paid) : (inv.amount_paid || 0)), 0))}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Outstanding</div>
          <div className="summary-value due">
            {formatCurrency(salesInvoices.reduce((sum, inv) => sum + (typeof inv.amount_due === 'string' ? parseFloat(inv.amount_due) : (inv.amount_due || 0)), 0))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        .invoices-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 12px;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-secondary);
          border-bottom: 2px solid var(--border-color);
        }

        td {
          padding: 12px;
          border-bottom: 1px solid var(--border-light);
          font-size: 14px;
        }

        tr:hover {
          background-color: var(--table-hover);
        }

        .paid {
          color: var(--positive);
          font-weight: 500;
        }

        .due {
          color: #f97316;
          font-weight: 500;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
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

        .summary-value.paid {
          color: var(--positive);
        }

        .summary-value.due {
          color: #f97316;
        }
      `}</style>
    </div>
  );
}