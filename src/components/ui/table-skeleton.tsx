import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 7 }: TableSkeletonProps) {
  return (
    <div className="dashboard-card">
      <div className="chart-title" style={{ marginBottom: '20px' }}>
        <Skeleton className="h-6 w-48" />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th
                  key={i}
                  style={{
                    padding: '12px',
                    borderBottom: '2px solid var(--border-color)',
                    background: 'var(--border-light)'
                  }}
                >
                  <Skeleton className="h-4 w-full" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-color)' }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} style={{ padding: '12px' }}>
                    <Skeleton className={`h-4 ${colIndex === 0 ? 'w-32' : 'w-20'}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}