# Phase 5: Project Features - Task Breakdown

## Overview
Complete task-oriented breakdown for implementing project list page, detailed project view with invoices/bills display, and complete estimates CRUD functionality matching MVP design.

## Prerequisites Check
**T163-Project Features Prerequisites**: Verify requirements
- Confirm Phase 1-4 complete
- Check dashboard functioning
- Verify database queries working
- Review MVP project screenshots
- Dependencies: Phase 1-4 Complete
- Estimated Time: 5 minutes

## Projects List Page Setup

**T164-Create Projects Route**: Set up projects page
- Navigate to `src/app/(protected)/projects/`
- Create or update `page.tsx`
- Set up Server Component
- Add gradient background
- Dependencies: T163
- Estimated Time: 5 minutes

**T165-Create Projects Header**: Build page header matching MVP
- Copy dashboard header structure
- Update title to "Projects P&L Dashboard"
- Add date range subtitle
- Add Overview/All Projects toggle
- Set "All Projects" as active
- Dependencies: T164
- Estimated Time: 5 minutes

## Projects Table Implementation

**T166-Create Projects Table Component**: Build main table
- Create `src/components/projects/projects-table.tsx`
- Use shadcn Table component
- Add white card background
- Apply shadow and border
- Dependencies: T165
- Estimated Time: 8 minutes

**T167-Define Table Headers**: Set up columns per MVP
- Project Name column
- Revenue column (£ format)
- Cost of Sales column
- Operating Exp. column
- Net Profit column
- Margin % column
- Visual indicator column
- Dependencies: T166
- Estimated Time: 8 minutes

**T168-Implement Table Body**: Display project data
- Map through projects array
- Format all currency values
- Calculate margin percentages
- Apply green/red colors
- Dependencies: T167
- Estimated Time: 10 minutes

**T169-Add Profit Visualization**: Create visual indicators
- Create horizontal bar component
- Scale width by profit amount
- Apply green (#10b981) for positive
- Apply red (#ef4444) for negative
- Match MVP indicator style
- Dependencies: T168
- Estimated Time: 8 minutes

**T170-Make Rows Interactive**: Add click navigation
- Add hover effect on rows
- Change cursor to pointer
- Add click handler
- Navigate to `/projects/[id]`
- Dependencies: T169
- Estimated Time: 5 minutes

## Projects Filtering

**T171-Create Filter Component**: Build filter controls
- Create `src/components/projects/projects-filter.tsx`
- Add search input field
- Add status dropdown
- Add date range picker
- Dependencies: T170
- Estimated Time: 10 minutes

**T172-Implement Search Filter**: Add text search
- Filter by project name
- Filter by client name
- Case-insensitive search
- Real-time filtering
- Dependencies: T171
- Estimated Time: 5 minutes

**T173-Implement Status Filter**: Add status dropdown
- Create status options
- Filter by project status
- Handle "All" option
- Update table display
- Dependencies: T172
- Estimated Time: 5 minutes

**T174-Implement Sorting**: Add column sorting
- Add sort icons to headers
- Implement ascending/descending
- Sort by any column
- Maintain sort state
- Dependencies: T173
- Estimated Time: 8 minutes

## Project Detail Page Setup

**T175-Create Dynamic Route**: Set up project detail route
- Create `src/app/(protected)/projects/[id]/` directory
- Create `page.tsx` file
- Set up dynamic params
- Add Server Component
- Dependencies: T174
- Estimated Time: 5 minutes

**T176-Add Back Navigation**: Create back button
- Add "← Back to All Projects" button
- Style consistently with MVP
- Position at top of page
- Link to projects list
- Dependencies: T175
- Estimated Time: 3 minutes

**T177-Create Project Header**: Build detail header
- Display project name as title
- Show client name
- Add date range
- Match MVP layout
- Dependencies: T176
- Estimated Time: 5 minutes

## Project KPI Cards

**T178-Create Income Card**: Build total income KPI
- Display "TOTAL INCOME" label
- Format value as GBP
- Use consistent card styling
- Position in grid
- Dependencies: T177
- Estimated Time: 5 minutes

**T179-Create Gross Profit Card**: Build gross profit KPI
- Display "GROSS PROFIT" label
- Show value in green (#10b981)
- Calculate and show margin %
- Format as GBP
- Dependencies: T178
- Estimated Time: 5 minutes

**T180-Create Net Profit Card**: Build net profit KPI
- Display "NET PROFIT" label
- Show value in green/red based on sign
- Calculate and show margin %
- Complete KPI row
- Dependencies: T179
- Estimated Time: 5 minutes

## Financial Breakdown Sections

**T181-Create Income Section**: Build income breakdown
- Create "Income Breakdown" header
- List all income line items
- Show amounts for each
- Calculate total income
- Dependencies: T180
- Estimated Time: 8 minutes

**T182-Create Cost of Sales Section**: Build costs breakdown
- Create "Cost of Sales" header
- List materials and tools
- List subcontractor costs
- Show individual amounts
- Calculate total costs
- Dependencies: T181
- Estimated Time: 8 minutes

**T183-Create Operating Expenses Section**: Build expenses breakdown
- Create "Operating Expenses" header
- List all expense items
- Show amounts in red
- Calculate total expenses
- Match MVP layout
- Dependencies: T182
- Estimated Time: 8 minutes

## Invoices Display

**T184-Create Invoices Tab**: Build invoices section
- Create tabs component
- Add "Invoices" tab
- Set up tab panel
- Dependencies: T183
- Estimated Time: 5 minutes

**T185-Create Invoice Table**: Display invoice list
- Create table structure
- Add invoice number column
- Add date column
- Add amount column
- Add status column
- Dependencies: T184
- Estimated Time: 8 minutes

**T186-Fetch Invoice Data**: Get invoices from database
- Create getInvoicesByProject query
- Fetch in Server Component
- Pass to client component
- Handle empty state
- Dependencies: T185
- Estimated Time: 5 minutes

**T187-Style Invoice Status**: Add status badges
- Create status badge component
- Color code by status
- Apply to status column
- Match MVP styling
- Dependencies: T186
- Estimated Time: 5 minutes

## Bills Display

**T188-Create Bills Tab**: Build bills section
- Add "Bills" tab to tabs
- Create bills panel
- Mirror invoices structure
- Dependencies: T187
- Estimated Time: 5 minutes

**T189-Create Bills Table**: Display bills list
- Create table structure
- Add bill number column
- Add vendor column
- Add date and amount
- Add status column
- Dependencies: T188
- Estimated Time: 8 minutes

**T190-Fetch Bills Data**: Get bills from database
- Create getBillsByProject query
- Fetch in Server Component
- Format for display
- Handle empty state
- Dependencies: T189
- Estimated Time: 5 minutes

## Estimates CRUD - Display

**T191-Create Estimates Tab**: Build estimates section
- Add "Estimates" tab
- Create estimates panel
- Add "Add Estimate" button
- Dependencies: T190
- Estimated Time: 5 minutes

**T192-Create Estimates Table**: Display estimates list
- Create table structure
- Add description column
- Add amount column
- Add date column
- Add actions column
- Dependencies: T191
- Estimated Time: 8 minutes

**T193-Fetch Estimates Data**: Get estimates from database
- Create getEstimatesByProject query
- Fetch user's estimates only
- Sort by date
- Handle empty state
- Dependencies: T192
- Estimated Time: 5 minutes

## Estimates CRUD - Create

**T194-Create Add Estimate Dialog**: Build create modal
- Create dialog component
- Add form fields
- Add description input
- Add amount input
- Add date picker
- Dependencies: T193
- Estimated Time: 10 minutes

**T195-Implement Create API**: Build create endpoint
- Create POST `/api/estimates` route
- Validate input data
- Insert to database
- Return created estimate
- Dependencies: T194
- Estimated Time: 8 minutes

**T196-Connect Create Form**: Wire up creation
- Handle form submission
- Call API endpoint
- Handle success response
- Update estimates list
- Show success message
- Dependencies: T195
- Estimated Time: 5 minutes

## Estimates CRUD - Update

**T197-Create Edit Dialog**: Build edit modal
- Copy create dialog structure
- Pre-populate with data
- Add update button
- Handle cancel action
- Dependencies: T196
- Estimated Time: 8 minutes

**T198-Implement Update API**: Build update endpoint
- Create PATCH `/api/estimates/[id]` route
- Validate ownership
- Update database record
- Return updated estimate
- Dependencies: T197
- Estimated Time: 8 minutes

**T199-Connect Edit Form**: Wire up editing
- Handle form submission
- Call update API
- Handle success response
- Update estimates list
- Show success message
- Dependencies: T198
- Estimated Time: 5 minutes

## Estimates CRUD - Delete

**T200-Create Delete Confirmation**: Build delete dialog
- Create confirmation modal
- Add warning message
- Add confirm/cancel buttons
- Style with destructive colors
- Dependencies: T199
- Estimated Time: 5 minutes

**T201-Implement Delete API**: Build delete endpoint
- Create DELETE `/api/estimates/[id]` route
- Validate ownership
- Delete from database
- Return success status
- Dependencies: T200
- Estimated Time: 5 minutes

**T202-Connect Delete Action**: Wire up deletion
- Handle delete button click
- Show confirmation dialog
- Call delete API
- Update estimates list
- Show success message
- Dependencies: T201
- Estimated Time: 5 minutes

## Form Validation

**T203-Add Client Validation**: Implement form validation
- Validate required fields
- Check amount is positive
- Validate date format
- Show inline errors
- Dependencies: T202
- Estimated Time: 8 minutes

**T204-Add Server Validation**: Implement API validation
- Use Zod schemas
- Validate all inputs
- Return specific errors
- Handle edge cases
- Dependencies: T203
- Estimated Time: 5 minutes

## Loading States

**T205-Add Table Loading**: Create loading skeletons
- Create skeleton rows
- Match table structure
- Add shimmer effect
- Apply to all tables
- Dependencies: T204
- Estimated Time: 5 minutes

**T206-Add Form Loading**: Handle form submissions
- Add loading spinners
- Disable form during submit
- Show progress indication
- Handle timeout
- Dependencies: T205
- Estimated Time: 5 minutes

## Error Handling

**T207-Handle Fetch Errors**: Manage data errors
- Catch query failures
- Display error messages
- Add retry option
- Log errors properly
- Dependencies: T206
- Estimated Time: 5 minutes

**T208-Handle CRUD Errors**: Manage operation failures
- Handle API errors
- Show user-friendly messages
- Preserve form data
- Allow retry
- Dependencies: T207
- Estimated Time: 5 minutes

## Optimistic Updates

**T209-Implement Optimistic UI**: Add instant feedback
- Update UI immediately
- Rollback on error
- Show pending state
- Sync with server
- Dependencies: T208
- Estimated Time: 8 minutes

## Testing

**T210-Test Projects List**: Verify list functionality
- Test data display
- Test filtering
- Test sorting
- Test navigation
- Dependencies: T209
- Estimated Time: 5 minutes

**T211-Test Project Detail**: Verify detail page
- Test data display
- Test tab navigation
- Check all sections
- Verify calculations
- Dependencies: T210
- Estimated Time: 5 minutes

**T212-Test Estimates CRUD**: Verify CRUD operations
- Test create flow
- Test edit flow
- Test delete flow
- Test validation
- Dependencies: T211
- Estimated Time: 8 minutes

## Documentation

**T213-Document API Endpoints**: Create API docs
- Document estimates endpoints
- List required parameters
- Show example responses
- Add error codes
- Dependencies: T212
- Estimated Time: 5 minutes

**T214-Document Components**: Add component docs
- Document props interfaces
- Add usage examples
- Document events
- Add customization notes
- Dependencies: T213
- Estimated Time: 5 minutes

## Final Verification

**T215-Compare with MVP**: Visual verification
- Check projects list layout
- Verify detail page sections
- Confirm color scheme
- Validate all interactions
- Dependencies: T214
- Estimated Time: 5 minutes

**T216-Test User Flow**: End-to-end testing
- Navigate from dashboard
- View projects list
- Open project detail
- Create/edit/delete estimate
- Return to dashboard
- Dependencies: T215
- Estimated Time: 8 minutes

**T217-Phase Completion Check**: Final verification
- Review all pages created
- Verify CRUD working
- Check responsive design
- Commit project features
- Dependencies: T216
- Estimated Time: 5 minutes

---

## Summary
- Total Tasks: 55 (T163-T217)
- Estimated Total Time: 7-8 hours
- Critical Path: T163 → T164-T170 → T175-T180 → T181-T190 → T191-T202 → T203-T217

## Success Criteria
- [ ] Projects list page matching MVP design
- [ ] Clickable table rows with all columns
- [ ] Project detail page with financial breakdown
- [ ] Invoices and Bills display (read-only)
- [ ] Complete Estimates CRUD functionality
- [ ] All data properly formatted (GBP)
- [ ] Consistent color scheme (green/red)
- [ ] Navigation between pages working