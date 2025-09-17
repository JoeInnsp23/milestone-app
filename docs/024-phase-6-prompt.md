# Phase 6: Export Functionality - Implementation Prompt

## Context Initialization
You are tasked with implementing Phase 6 of the Milestone P&L Dashboard project. This phase adds PDF and Excel export capabilities using Server Actions with server-side generation.

## Pre-Implementation Requirements

### 1. Document Review
First, thoroughly read and understand these documents in this exact order:
1. `/root/projects/milestone-app/project-plan.md` - Review export requirements
2. `/root/projects/milestone-app/phase-6-details.md` - Export specification
3. `/root/projects/milestone-app/phase-6-tasks.md` - Study all 56 tasks (T218-T273)
4. `/root/projects/milestone-app/phase-6-QA.md` - Understand validation requirements
5. Review `.reference` folder for report layouts

### 2. Context Building
Before starting implementation:
- Use `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs` to research:
  - PDFKit for Node.js (server-side PDF)
  - ExcelJS for spreadsheet generation
  - Server Actions with file downloads
  - Base64 data URLs
- Use WebSearch to find:
  - PDFKit vs @react-pdf (use PDFKit for server-side)
  - Server Action file download patterns
  - ExcelJS streaming for large datasets
  - Next.js production basePath handling

### 3. Best Practice Research
**CRITICAL**: Based on research, use:
- PDFKit (NOT @react-pdf/renderer) - server-side is faster
- Server Actions (NOT API routes) - simpler for 3-5 users
- Base64 data URLs for downloads
- Pre-built templates (summary/detailed only)

## Implementation Instructions

### Phase 6 Task Execution (T218-T273)

#### Package Installation (T219-T221):
```bash
# PDF generation (server-side)
npm install pdfkit
npm install -D @types/pdfkit

# Excel generation
npm install exceljs
npm install -D @types/exceljs

# Utilities
npm install buffer  # For base64 encoding
```

#### Directory Structure (T222):
```
src/
├── lib/
│   └── export/
│       ├── config.ts        # Export configuration
│       ├── utils.ts         # Formatting utilities
│       ├── pdf-generator.ts # PDFKit implementation
│       └── excel-builder.ts # ExcelJS implementation
└── app/
    └── actions/
        └── export.ts        # Server Actions
```

#### Server Actions Setup (T228-T229):
```typescript
// src/app/actions/export.ts
'use server'

import { auth } from "@clerk/nextjs";
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export async function exportPDF(
  type: 'dashboard' | 'project',
  id?: string,
  template: 'summary' | 'detailed' = 'summary'
) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // Fetch data based on type
  const data = type === 'dashboard'
    ? await getDashboardData(userId)
    : await getProjectData(id!, userId);

  // Generate PDF server-side
  const pdfBuffer = await generatePDF(data, template);

  // Convert to base64 data URL
  const base64 = pdfBuffer.toString('base64');
  const dataUrl = `data:application/pdf;base64,${base64}`;

  // Log to export_history with UUID
  await db.insert(exportHistory).values({
    id: crypto.randomUUID(),
    user_id: userId,
    export_type: 'pdf',
    template,
    created_at: new Date(),
  });

  return { dataUrl, filename: `milestone-${Date.now()}.pdf` };
}

export async function exportExcel(
  type: 'dashboard' | 'project',
  id?: string,
  template: 'summary' | 'detailed' = 'summary'
) {
  // Similar pattern for Excel
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const data = await fetchExportData(type, id, userId);
  const excelBuffer = await generateExcel(data, template);

  const base64 = excelBuffer.toString('base64');
  const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

  return { dataUrl, filename: `milestone-${Date.now()}.xlsx` };
}
```

#### PDF Generation with PDFKit (T226-T232):
```typescript
// src/lib/export/pdf-generator.ts
import PDFDocument from 'pdfkit';

export async function generatePDF(
  data: ExportData,
  template: 'summary' | 'detailed'
): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Header with gradient effect (simulate with rectangles)
    doc.rect(0, 0, doc.page.width, 100)
       .fill('#3B82F6'); // Blue gradient simulation

    // Title
    doc.fillColor('white')
       .fontSize(24)
       .text('Project P&L Report', 50, 40);

    // Generated date
    doc.fontSize(10)
       .text(`Generated on ${new Date().toLocaleDateString('en-GB')}`, 50, 70);

    // Reset for content
    doc.fillColor('black');

    // Project Summary Section
    doc.fontSize(16)
       .text('Project Summary', 50, 120);

    // KPI Cards equivalent
    doc.fontSize(12)
       .text(`Total Revenue: ${formatGBP(data.revenue)}`, 50, 150)
       .text(`Total Costs: ${formatGBP(data.costs)}`, 50, 170)
       .text(`Net Profit: ${formatGBP(data.profit)}`, 50, 190);

    // Add profit/loss color
    if (data.profit > 0) {
      doc.fillColor('#10b981'); // Green
    } else {
      doc.fillColor('#ef4444'); // Red
    }
    doc.text(`Margin: ${data.margin}%`, 50, 210);

    if (template === 'detailed') {
      // Add detailed sections
      addIncomeBreakdown(doc, data);
      addCostBreakdown(doc, data);
      addInvoicesList(doc, data);
      addBillsList(doc, data);
    }

    // Footer
    doc.fontSize(8)
       .fillColor('gray')
       .text('Build By Milestone', 50, doc.page.height - 50)
       .text(`Page 1`, doc.page.width - 100, doc.page.height - 50);

    doc.end();
  });
}

function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}
```

#### Excel Generation with ExcelJS (T240-T248):
```typescript
// src/lib/export/excel-builder.ts
import ExcelJS from 'exceljs';

export async function generateExcel(
  data: ExportData,
  template: 'summary' | 'detailed'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Summary sheet (always included)
  const summarySheet = workbook.addWorksheet('Summary');

  // Header styling
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' },
  };

  // Add headers
  summarySheet.columns = [
    { header: 'Project', key: 'project', width: 30 },
    { header: 'Revenue', key: 'revenue', width: 15 },
    { header: 'Costs', key: 'costs', width: 15 },
    { header: 'Net Profit', key: 'profit', width: 15 },
    { header: 'Margin %', key: 'margin', width: 12 },
  ];

  // Add data with GBP formatting
  data.projects.forEach(project => {
    const row = summarySheet.addRow({
      project: project.name,
      revenue: project.revenue,
      costs: project.costs,
      profit: project.profit,
      margin: project.margin,
    });

    // Format currency columns
    row.getCell('revenue').numFmt = '£#,##0.00';
    row.getCell('costs').numFmt = '£#,##0.00';
    row.getCell('profit').numFmt = '£#,##0.00';

    // Color code profit/loss
    if (project.profit > 0) {
      row.getCell('profit').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }, // Green
      };
    } else {
      row.getCell('profit').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEF4444' }, // Red
      };
    }
  });

  if (template === 'detailed') {
    // Add Monthly Trends sheet
    const trendsSheet = workbook.addWorksheet('Monthly Trends');
    addMonthlyData(trendsSheet, data);

    // Add Invoices sheet
    const invoicesSheet = workbook.addWorksheet('Invoices');
    addInvoicesData(invoicesSheet, data);

    // Add Bills sheet
    const billsSheet = workbook.addWorksheet('Bills');
    addBillsData(billsSheet, data);
  }

  // Generate buffer
  return await workbook.xlsx.writeBuffer();
}
```

#### Export UI Components (T253-T255):
```typescript
// src/components/export/export-button.tsx
'use client'

import { useState, useTransition } from 'react';
import { exportPDF, exportExcel } from '@/app/actions/export';

export function ExportButton({ type, id }: ExportButtonProps) {
  const [pending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);

  async function handleExport(format: 'pdf' | 'excel', template: 'summary' | 'detailed') {
    startTransition(async () => {
      const action = format === 'pdf' ? exportPDF : exportExcel;
      const result = await action(type, id, template);

      // Download file using data URL
      const link = document.createElement('a');
      link.href = result.dataUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowMenu(false);
    });
  }

  return (
    <div className="relative">
      <Button onClick={() => setShowMenu(!showMenu)} disabled={pending}>
        {pending ? 'Exporting...' : 'Export'}
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
          <button onClick={() => handleExport('pdf', 'summary')}>
            Export as PDF (Summary)
          </button>
          <button onClick={() => handleExport('pdf', 'detailed')}>
            Export as PDF (Detailed)
          </button>
          <button onClick={() => handleExport('excel', 'summary')}>
            Export as Excel (Summary)
          </button>
          <button onClick={() => handleExport('excel', 'detailed')}>
            Export as Excel (Detailed)
          </button>
        </div>
      )}
    </div>
  );
}
```

#### Integration Points (T256-T258):
Add export button to:
1. Dashboard page header
2. Projects list page
3. Individual project detail page

#### Streaming Support for Large Datasets (T251):
```typescript
// For large exports (future enhancement)
export async function streamLargeExcel(projectIds: string[]) {
  // Use ExcelJS streaming API
  const options = {
    stream: new PassThrough(),
    useStyles: true,
    useSharedStrings: true,
  };

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
  // Stream data in chunks...
}
```

#### basePath Configuration (T252):
```typescript
// Handle production subdirectory
const basePath = process.env.NODE_ENV === 'production' ? '/milestone-app' : '';
// Use in any absolute paths if needed
```

### Critical Implementation Points:

1. **Server-Side Generation:**
   - Use PDFKit (NOT @react-pdf)
   - Generate on server with Server Actions
   - Return base64 data URLs

2. **Template Simplicity:**
   - Only 2 templates: summary and detailed
   - No complex customization
   - Pre-built layouts only

3. **GBP Formatting:**
   - All currency values as £X,XXX.XX
   - Use Intl.NumberFormat
   - Apply to both PDF and Excel

4. **Performance:**
   - Generate in memory
   - Use buffers, not files
   - Stream for large datasets

## Quality Assurance Execution

After completing ALL tasks (T218-T273), execute the QA validation:

### Phase 6 QA Validation (QA251-QA300)

Critical QA checks:
- QA251-QA260: UI and button validation
- QA261-QA270: PDF generation and content
- QA271-QA280: Excel generation and formatting
- QA281-QA290: Data accuracy and integrity
- QA291-QA300: Performance and error handling

### Testing Checklist:
```bash
# 1. Export Button Testing
- Find export button on dashboard
- Click and see dropdown menu
- Test each export option

# 2. PDF Testing
- Export PDF (summary)
- Export PDF (detailed)
- Open in PDF reader
- Verify formatting and data
- Check GBP currency display

# 3. Excel Testing
- Export Excel (summary)
- Export Excel (detailed)
- Open in Excel/Google Sheets
- Verify multiple worksheets
- Check formulas and formatting

# 4. Performance Testing
- Export large project
- Monitor generation time
- Verify no timeouts
```

## Success Criteria
Phase 6 is complete when:
- [ ] All 56 tasks (T218-T273) completed
- [ ] All 50 QA checks (QA251-QA300) pass
- [ ] PDF export working via Server Actions
- [ ] Excel export with multiple sheets
- [ ] Both summary and detailed templates
- [ ] All currency in GBP format (£)
- [ ] "Build By Milestone" branding included
- [ ] Downloads work via data URLs
- [ ] Export history tracked with UUIDs
- [ ] Performance acceptable (<5s)

## Common Issues & Solutions

1. **PDF not generating:**
   - Check PDFKit installed (not @react-pdf)
   - Verify buffer handling
   - Test with simple content first

2. **Excel formulas not working:**
   ```typescript
   // Add formulas correctly
   summarySheet.getCell('B10').value = {
     formula: 'SUM(B2:B9)',
     result: total,
   };
   ```

3. **Download not triggering:**
   - Ensure data URL is valid base64
   - Check browser console for errors
   - Verify MIME types correct

4. **Large file issues:**
   - Implement streaming for >100 projects
   - Use pagination in exports
   - Optimize memory usage

## Verification Commands
```bash
# Check packages
npm list pdfkit exceljs

# Verify Server Actions
grep -r "exportPDF\|exportExcel" src/app/actions/

# Test export endpoint exists
ls -la src/app/actions/export.ts

# Check no API routes created
ls -la src/app/api/ | grep -v webhooks

# Build test
npm run build
```

## Critical Notes
- DO NOT use @react-pdf/renderer (use PDFKit)
- DO NOT create API routes (use Server Actions)
- DO NOT save files to disk (use data URLs)
- DO NOT forget GBP formatting
- Keep templates simple (2 options only)
- Remember: basePath for production

Upon completion, Phase 6 should provide full export functionality for both PDF and Excel formats, ready for deployment in Phase 7.