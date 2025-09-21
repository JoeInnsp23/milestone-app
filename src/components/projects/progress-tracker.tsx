'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Minus, Plus } from 'lucide-react';
import { updatePhaseProgress } from '@/app/actions/phases';
import toast from 'react-hot-toast';

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
      toast.success(`Progress updated to ${newProgress}%`);
    } catch (error) {
      console.error('Failed to update progress:', error);
      setProgress(progress); // Revert on error
      toast.error('Failed to update progress');
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

        <Progress
          value={progress}
          className="flex-1"
          style={{
            '--progress-color': phaseColor
          } as React.CSSProperties}
        />

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