'use client';

import { DashboardHeader } from './dashboard-header';

export function DashboardHeaderWrapper(props: React.ComponentProps<typeof DashboardHeader>) {
  return <DashboardHeader {...props} />;
}