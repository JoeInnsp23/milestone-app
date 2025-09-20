'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportPDF, exportExcel } from '@/app/actions/export';

interface ExportButtonProps {
  projectId?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function ExportButton({
  projectId,
  className,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'excel', selectedTemplate: 'summary' | 'detailed') => {
    setIsExporting(true);
    setExportFormat(`${format}-${selectedTemplate}`);

    try {
      // Show preparing message
      const toastId = toast.loading(`Generating ${format.toUpperCase()} export...`);
      const startTime = Date.now();

      // Perform export
      const result = format === 'pdf'
        ? await exportPDF(selectedTemplate, projectId)
        : await exportExcel(selectedTemplate, projectId);

      if (!result.success) {
        throw new Error(result.error || 'Export failed');
      }

      // Download the file using data URL
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = result.dataUrl;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Calculate file size for display
      const base64Length = result.dataUrl.split(',')[1]?.length || 0;
      const fileSizeKB = Math.round((base64Length * 0.75) / 1024);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      toast.success(
        `${format.toUpperCase()} exported successfully (${fileSizeKB}KB in ${duration}s)`,
        { id: toastId }
      );
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMessage || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting} className={className}>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('pdf', 'summary')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF (Summary)
          {isExporting && exportFormat === 'pdf-summary' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('pdf', 'detailed')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF (Detailed)
          {isExporting && exportFormat === 'pdf-detailed' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('excel', 'summary')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel (Summary)
          {isExporting && exportFormat === 'excel-summary' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('excel', 'detailed')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel (Detailed)
          {isExporting && exportFormat === 'excel-detailed' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}