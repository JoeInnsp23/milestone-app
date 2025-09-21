'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { PhaseAssignmentProps } from '@/types';
import { updateItemPhase } from '@/app/actions/phases';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';

export function PhaseAssignmentPopover({
  itemId,
  itemType,
  currentPhaseId,
  currentProjectId,
  phases,
  projects
}: PhaseAssignmentProps) {
  const [phaseId, setPhaseId] = useState<string | null>(currentPhaseId);
  const [projectId, setProjectId] = useState(currentProjectId);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateItemPhase({
        itemId,
        itemType,
        phaseId,
        projectId
      });
      toast.success('Phase assignment updated');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update phase:', error);
      toast.error('Failed to update phase assignment');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhaseSelect = (selectedPhaseId: string) => {
    setPhaseId(selectedPhaseId === 'unassigned' ? null : selectedPhaseId);
  };

  const handleProjectSelect = (selectedProjectId: string) => {
    setProjectId(selectedProjectId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Assign Phase & Project</h4>
            <p className="text-xs text-muted-foreground">
              Changes will sync to Xero on next update
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phase-select" className="text-sm font-medium">
                Construction Phase
              </Label>
              <Select
                value={phaseId || 'unassigned'}
                onValueChange={handlePhaseSelect}
              >
                <SelectTrigger id="phase-select">
                  <SelectValue placeholder="Select a phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span>Unassigned</span>
                    </div>
                  </SelectItem>
                  {phases.map(phase => (
                    <SelectItem key={phase.id} value={phase.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: phase.color || '#6B7280' }}
                        />
                        <span>{phase.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-select" className="text-sm font-medium">
                Project
              </Label>
              <Select
                value={projectId}
                onValueChange={handleProjectSelect}
              >
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}