import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header skeleton */}
      <div className="pb-1">
        <div className="container mx-auto p-6">
          <div className="bg-card/10 backdrop-blur rounded-lg p-6 border border-white/10">
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-9 w-80 bg-white/20" />
                <Skeleton className="mt-2 h-5 w-96 bg-white/20" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 bg-white/20" />
                <Skeleton className="h-10 w-28 bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="container mx-auto p-6">
        {/* KPI Cards skeleton */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card/95 backdrop-blur border-0 shadow-lg">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <Card className="bg-card/95 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
          <Card className="bg-card/95 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Table skeleton */}
        <Card className="bg-card/95 backdrop-blur border-0 shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-80" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}