export function DashboardSkeleton() {
  return (
    <div className="min-h-screen dashboard-bg-gradient animate-in fade-in duration-300">
      {/* Navigation skeleton */}
      <div className="nav-bar">
        <div className="nav-content">
          <div className="nav-title">Project Hub</div>
          <div className="nav-buttons">
            <div className="h-9 w-20 bg-white/10 rounded-md animate-pulse" />
            <div className="h-9 w-24 bg-white/10 rounded-md animate-pulse" />
            <div className="h-9 w-9 bg-white/10 rounded-md animate-pulse" />
            <div className="h-8 w-8 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container">
        {/* Header skeleton */}
        <div className="header-card">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="h-8 w-48 bg-white/10 rounded-md animate-pulse mb-2" />
              <div className="h-5 w-64 bg-white/10 rounded-md animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-white/10 rounded-md animate-pulse" />
          </div>
        </div>

        {/* KPI Cards skeleton */}
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="h-4 w-32 bg-white/10 rounded-md animate-pulse mb-2" />
              <div className="h-8 w-24 bg-white/10 rounded-md animate-pulse" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="chart-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="chart-card">
              <div className="h-5 w-48 bg-white/10 rounded-md animate-pulse mb-4" />
              <div className="h-64 bg-white/5 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}