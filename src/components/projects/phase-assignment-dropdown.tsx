'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
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

export function PhaseAssignmentDropdown({
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
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update phase:', error);
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Assign Phase & Project</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-2 space-y-4">
          <div className="text-xs text-muted-foreground">
            Changes will be synced with n8n automatically
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase-select" className="text-xs font-medium">
              Construction Phase
            </Label>
            <Select
              value={phaseId || 'unassigned'}
              onValueChange={handlePhaseSelect}
            >
              <SelectTrigger id="phase-select" className="h-9">
                <SelectValue placeholder="Select a phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <span className="text-muted-foreground">Unassigned</span>
                </SelectItem>
                {phases.map(phase => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-select" className="text-xs font-medium">
              Project
            </Label>
            <Select
              value={projectId}
              onValueChange={handleProjectSelect}
            >
              <SelectTrigger id="project-select" className="h-9">
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

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}