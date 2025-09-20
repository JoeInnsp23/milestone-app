'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { updatePhaseProgress } from '@/app/actions/phases';

interface ProgressTrackerProps {
  phaseId: string;
  projectId: string;
  initialProgress: number;
  phaseColor: string;
}

export function ProgressTracker({
  phaseId,
  projectId,
  initialProgress,
  phaseColor
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleProgressChange = async (delta: number) => {
    const newProgress = Math.max(0, Math.min(100, progress + delta));
    if (newProgress === progress) return;

    setIsUpdating(true);
    setProgress(newProgress);

    try {
      await updatePhaseProgress(projectId, phaseId, newProgress);
    } catch (error) {
      console.error('Failed to update progress:', error);
      setProgress(progress); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">Progress</span>
        <span className="text-sm font-medium">{progress}%</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => handleProgressChange(-5)}
          disabled={isUpdating || progress === 0}
        >
          <Minus className="h-3 w-3" />
        </Button>

        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: phaseColor
            }}
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => handleProgressChange(5)}
          disabled={isUpdating || progress === 100}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}