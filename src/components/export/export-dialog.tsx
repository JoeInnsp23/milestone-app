'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportPDF, exportExcel } from '@/app/actions/export';

interface ExportDialogProps {
  projectId?: string;
  triggerClassName?: string;
  triggerVariant?: 'default' | 'outline' | 'ghost';
  triggerSize?: 'sm' | 'default' | 'lg';
}

export function ExportDialog({
  projectId,
  triggerClassName,
  triggerVariant = 'outline',
  triggerSize = 'default'
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [template, setTemplate] = useState<'summary' | 'detailed'>('summary');

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = format === 'pdf'
        ? await exportPDF(template, projectId)
        : await exportExcel(template, projectId);

      if (!result.success) {
        throw new Error(result.error || 'Export failed');
      }

      // Download the file
      const a = document.createElement('a');
      a.href = result.dataUrl;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Export completed successfully');
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Configure your export settings and choose the format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as 'pdf' | 'excel')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer font-normal">
                  PDF Document (.pdf)
                  <span className="block text-xs text-muted-foreground">
                    Best for reports and printing
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="cursor-pointer font-normal">
                  Excel Spreadsheet (.xlsx)
                  <span className="block text-xs text-muted-foreground">
                    Best for data analysis and manipulation
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Template Selection */}
          <div className="space-y-3">
            <Label>Template</Label>
            <RadioGroup
              value={template}
              onValueChange={(value) => setTemplate(value as 'summary' | 'detailed')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="summary" />
                <Label htmlFor="summary" className="cursor-pointer font-normal">
                  Summary Report
                  <span className="block text-xs text-muted-foreground">
                    Key metrics and overview
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="cursor-pointer font-normal">
                  Detailed Report
                  <span className="block text-xs text-muted-foreground">
                    Full data with monthly trends and breakdown
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}