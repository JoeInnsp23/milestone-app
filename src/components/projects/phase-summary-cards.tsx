import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/export/utils';
import {
  Hammer, Shovel, Layers, Home, Zap, Droplets,
  DoorOpen, PaintRoller, Paintbrush, Trees, ListChecks,
  HardHat, Grid3x3, ChefHat, Plus, Briefcase, HelpCircle
} from 'lucide-react';
import { PhaseSummary } from '@/types';
import { ProgressTracker } from './progress-tracker';

const phaseIcons: Record<string, any> = {
  demolition: Hammer,
  groundworks: Shovel,
  masonry: Layers,
  roofing: Home,
  electrical: Zap,
  plumbing: Droplets,
  joinery: Hammer,
  windows: DoorOpen,
  plastering: PaintRoller,
  decoration: Paintbrush,
  landscaping: Trees,
  finishes: ListChecks,
  steelwork: HardHat,
  flooring: Grid3x3,
  kitchen: ChefHat,
  extra: Plus,
  pm_fee: Briefcase
};

const phaseColors: Record<string, string> = {
  demolition: '#8B4513',
  groundworks: '#8B5A2B',
  masonry: '#A0522D',
  roofing: '#708090',
  electrical: '#FFD700',
  plumbing: '#4682B4',
  joinery: '#8B7355',
  windows: '#87CEEB',
  plastering: '#F5F5DC',
  decoration: '#9370DB',
  landscaping: '#228B22',
  finishes: '#DAA520',
  steelwork: '#696969',
  flooring: '#D2691E',
  kitchen: '#FF6347',
  extra: '#6B7280',
  pm_fee: '#4B0082'
};

export function PhaseSummaryCards({ phases }: { phases: PhaseSummary[] }) {
  if (!phases || phases.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No phase data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {phases.map((phase) => {
        const Icon = phaseIcons[phase.id] || HelpCircle;
        const color = phaseColors[phase.id] || '#6B7280';

        return (
          <Card key={phase.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-md"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{phase.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {phase.itemCount} {phase.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium">
                  {formatCurrency(phase.revenue)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Costs</span>
                <span className="font-medium">
                  {formatCurrency(phase.costs)}
                </span>
              </div>

              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Profit</span>
                <span className={`font-medium ${
                  phase.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(phase.profit)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margin</span>
                <span className={`font-medium ${
                  phase.margin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {phase.margin.toFixed(1)}%
                </span>
              </div>

              <ProgressTracker
                phaseId={phase.id}
                projectId={phase.projectId}
                initialProgress={phase.progress}
                phaseColor={color}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}