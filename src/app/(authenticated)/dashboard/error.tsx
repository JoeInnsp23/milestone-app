'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We encountered an error while loading the dashboard. This might be
            because:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
            <li>The database connection is unavailable</li>
            <li>No data has been synchronized yet</li>
            <li>There&apos;s a temporary network issue</li>
          </ul>
          <div className="mt-6">
            <Button onClick={() => reset()} className="w-full">
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}