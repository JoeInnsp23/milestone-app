'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  isProfit?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  isProfit = false,
  className
}: StatsCardProps) {
  return (
    <Card className={cn(
      "dashboard-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-3xl font-bold",
          isProfit ? "text-green-600 dark:text-green-400" : "text-foreground"
        )}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}