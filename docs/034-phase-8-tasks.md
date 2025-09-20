# Phase 8: Construction Phases Feature - Task Breakdown

## Overview
Complete task-oriented breakdown for implementing construction phase tracking, visualization, and management throughout the project details pages. This includes phase summary cards, grouping toggles, progress tracking, and integration with Xero tracking categories.

## Prerequisites Check
**T335-Phase 8 Prerequisites**: Verify requirements
- Confirm Phases 1-7 complete
- Check database schema ready
- Verify Xero tracking categories exist
- Review Phase 8 details document
- Ensure n8n webhook infrastructure ready
- Dependencies: Phases 1-7 Complete
- Estimated Time: 5 minutes

**T336-Create Feature Branch**: Set up development branch
- Create git branch `phase-8-construction-phases`
- Pull latest changes from main
- Verify development server running
- Clear test data if needed
- Dependencies: T335
- Estimated Time: 3 minutes

**T337-Review Existing Schema**: Understand current structure
- Check build_phases table structure
- Review invoice/bill phase fields
- Check estimate phase fields
- Note tracking_category_id usage
- Document any schema gaps
- Dependencies: T336
- Estimated Time: 5 minutes

## Database Schema Updates

**T338-Create Phase Progress Table**: Add progress tracking
- Create new migration file
- Define phase_progress table
- Add project_id foreign key
- Add build_phase_id foreign key
- Add progress_percentage field
- Dependencies: T337
- Estimated Time: 8 minutes

**T339-Add Progress Table Indexes**: Optimize queries
- Add index on project_id
- Add unique index on project_id + build_phase_id
- Add updated_at timestamp
- Add last_updated_by field
- Dependencies: T338
- Estimated Time: 5 minutes

**T340-Update Schema Types**: Add TypeScript definitions
- Update `src/db/schema.ts`
- Export phaseProgress table
- Add progress enum if needed
- Update type exports
- Dependencies: T339
- Estimated Time: 5 minutes

## Phase Configuration

**T341-Define Construction Phases 1-9**: Set up first half of phases
- Open `src/db/seed.ts`
- Define Demolition Enabling works
- Define Groundworks
- Define Masonry
- Define Roofing
- Define Electrical
- Define Plumbing & Heating
- Define Joinery
- Define Windows and doors
- Define Drylining & Plaster/Render
- Dependencies: T340
- Estimated Time: 10 minutes

**T342-Define Construction Phases 10-17**: Complete phase list
- Define Decoration
- Define Landscaping
- Define Finishes Schedule
- Define Steelwork
- Define Flooring/Tiling
- Define Kitchen
- Define Extra
- Define Project Management Fee
- Set appropriate colors and icons
- Dependencies: T341
- Estimated Time: 8 minutes

**T343-Update Seed Script**: Add phases to database
- Insert phases into build_phases table
- Set display_order for each
- Add tracking_category_id
- Test seed script runs
- Verify phases inserted
- Dependencies: T342
- Estimated Time: 5 minutes

**T344-Assign Test Data Phases**: Update existing data
- Update test invoices with phases
- Update test bills with phases
- Update test estimates with phases
- Leave some as unassigned
- Run updated seed script
- Dependencies: T343
- Estimated Time: 8 minutes

## Phase Summary Cards Component

**T345-Create Cards Component File**: Initialize component
- Create `src/components/projects/phase-summary-cards.tsx`
- Add 'use client' directive
- Import necessary UI components
- Define component interface
- Export component function
- Dependencies: T344
- Estimated Time: 5 minutes

**T346-Define Phase Summary Interface**: Type definitions
- Create PhaseSummary interface
- Add phase_id, name, color, icon
- Add revenue, costs, profit, margin
- Add progress percentage
- Add item counts
- Dependencies: T345
- Estimated Time: 3 minutes

**T347-Build Card Layout**: Create card structure
- Create responsive grid layout
- Use md:grid-cols-2 lg:grid-cols-3
- Add gap between cards
- Set margin bottom
- Import Card components
- Dependencies: T346
- Estimated Time: 5 minutes

**T348-Create Individual Card**: Design phase card
- Add CardHeader with icon
- Display phase name
- Show item count badge
- Add colored icon background
- Match KPI card styling
- Dependencies: T347
- Estimated Time: 8 minutes

**T349-Add Financial Metrics**: Display phase financials
- Add revenue display
- Add costs display
- Add profit with color coding
- Add margin percentage
- Format with GBP currency
- Dependencies: T348
- Estimated Time: 5 minutes

**T350-Implement Progress Bar**: Add progress visualization
- Import Progress component
- Display current percentage
- Add progress label
- Style progress bar
- Use phase color for bar
- Dependencies: T349
- Estimated Time: 5 minutes

**T351-Add Progress Controls**: Plus/minus buttons
- Import Minus and Plus icons
- Add decrease button (-5%)
- Add increase button (+5%)
- Position buttons at ends
- Set button size to small
- Dependencies: T350
- Estimated Time: 5 minutes

**T352-Handle Progress Updates**: Implement state logic
- Add useState for progress
- Create handleProgressChange function
- Clamp values 0-100
- Update local state
- Prepare for API call
- Dependencies: T351
- Estimated Time: 8 minutes

**T353-Add Icon Resolver**: Dynamic icon loading
- Import * as LucideIcons
- Create getIcon helper function
- Handle unknown icon names
- Return HelpCircle as fallback
- Dependencies: T352
- Estimated Time: 5 minutes

**T354-Style Phase Cards**: Apply consistent styling
- Match existing KPI card styles
- Add hover effects
- Ensure responsive design
- Test dark mode compatibility
- Add loading states
- Dependencies: T353
- Estimated Time: 5 minutes

## Phase Assignment Popover

**T355-Create Popover Component**: Initialize assignment UI
- Create `src/components/projects/phase-assignment-popover.tsx`
- Add 'use client' directive
- Import Popover components
- Import Select components
- Define component interface
- Dependencies: T354
- Estimated Time: 5 minutes

**T356-Build Popover Trigger**: Create settings button
- Import Settings2 icon
- Create icon button trigger
- Set variant to ghost
- Size button appropriately
- Add hover tooltip
- Dependencies: T355
- Estimated Time: 3 minutes

**T357-Design Popover Content**: Create assignment form
- Add title "Assign Phase & Project"
- Add helper text about sync
- Create form layout
- Add spacing between elements
- Set popover width
- Dependencies: T356
- Estimated Time: 5 minutes

**T358-Add Phase Selector**: Phase dropdown
- Create Select for phases
- Map available phases
- Show phase color indicator
- Display current selection
- Handle value changes
- Dependencies: T357
- Estimated Time: 5 minutes

**T359-Add Project Selector**: Project dropdown
- Create Select for projects
- Map available projects
- Show placeholder if empty
- Handle project changes
- Add form validation
- Dependencies: T358
- Estimated Time: 5 minutes

**T360-Implement Save Logic**: Handle assignments
- Create handleSave function
- Add loading state
- Call update API
- Trigger webhook
- Show success/error toast
- Dependencies: T359
- Estimated Time: 8 minutes

**T361-Add Cancel Button**: Form controls
- Add Cancel button
- Add Save button
- Handle popover close
- Disable during saving
- Position buttons right
- Dependencies: T360
- Estimated Time: 3 minutes

## Grouping Implementation

**T362-Create Enhanced Tabs**: New tabs component
- Create `src/components/projects/project-tabs-enhanced.tsx`
- Add 'use client' directive
- Import necessary components
- Define component props
- Set up state management
- Dependencies: T361
- Estimated Time: 5 minutes

**T363-Add Toggle Switch**: Group by phase control
- Import Switch component
- Add toggle state (default true)
- Position in card header
- Add label "Group by Phase"
- Handle toggle changes
- Dependencies: T362
- Estimated Time: 5 minutes

**T364-Create Grouping Logic**: Implement grouping function
- Create groupItemsByPhase function
- Check toggle state
- Group items by build_phase_id
- Handle unassigned items
- Return grouped structure
- Dependencies: T363
- Estimated Time: 10 minutes

**T365-Sort Within Groups**: Chronological ordering
- Sort items by date within groups
- Use invoice_date for invoices
- Use bill_date for bills
- Use created_at for estimates
- Maintain descending order
- Dependencies: T364
- Estimated Time: 5 minutes

**T366-Calculate Subtotals**: Group totals
- Calculate subtotal per group
- Sum invoice amounts
- Sum bill amounts
- Sum estimate amounts
- Store in group object
- Dependencies: T365
- Estimated Time: 5 minutes

**T367-Render Group Headers**: Display phase groups
- Show phase color indicator
- Display phase name
- Show item count
- Display subtotal amount
- Add visual separator
- Dependencies: T366
- Estimated Time: 5 minutes

**T368-Render Grouped Items**: Display items in groups
- Map through grouped items
- Show item details
- Include date and amount
- Add phase assignment button
- Maintain existing item layout
- Dependencies: T367
- Estimated Time: 8 minutes

**T369-Handle Ungrouped View**: Chronological display
- Show all items in one list
- Sort by date descending
- Show phase as badge
- Keep assignment button
- Calculate total at bottom
- Dependencies: T368
- Estimated Time: 5 minutes

## Progress Tracking Implementation

**T370-Create Progress Update Action**: Server action
- Create updatePhaseProgress function
- Add to `src/app/actions/phases.ts`
- Validate user authentication
- Accept projectId, phaseId, progress
- Return success/error
- Dependencies: T369
- Estimated Time: 8 minutes

**T371-Implement Database Update**: Save progress
- Use upsert logic
- Update phase_progress table
- Set progress_percentage
- Update last_updated_by
- Update timestamp
- Dependencies: T370
- Estimated Time: 5 minutes

**T372-Add Audit Logging**: Track changes
- Log progress updates
- Include user_id
- Add metadata object
- Store old/new values
- Insert into audit_logs
- Dependencies: T371
- Estimated Time: 5 minutes

**T373-Handle Progress in UI**: Connect to component
- Call server action on change
- Update local state optimistically
- Handle errors gracefully
- Show loading state
- Revalidate on success
- Dependencies: T372
- Estimated Time: 5 minutes

**T374-Add Progress Persistence**: Maintain state
- Load initial progress from DB
- Store in component state
- Sync with server on change
- Handle offline scenarios
- Queue failed updates
- Dependencies: T373
- Estimated Time: 8 minutes

## Phase Assignment Actions

**T375-Create Update Item Action**: Server action for items
- Create updateItemPhase function
- Add to actions/phases.ts
- Accept itemId, itemType, data
- Validate user permission
- Handle different item types
- Dependencies: T374
- Estimated Time: 8 minutes

**T376-Update Invoice Phase**: Handle invoice updates
- Update invoices table
- Set build_phase_id
- Set project_id if changed
- Update updated_at
- Handle errors
- Dependencies: T375
- Estimated Time: 5 minutes

**T377-Update Bill Phase**: Handle bill updates
- Update bills table
- Set build_phase_id
- Set project_id if changed
- Update updated_at
- Handle errors
- Dependencies: T376
- Estimated Time: 5 minutes

**T378-Update Estimate Phase**: Handle estimate updates
- Update project_estimates table
- Set build_phase_id
- Update updated_at
- Handle version control
- Maintain estimate history
- Dependencies: T377
- Estimated Time: 5 minutes

**T379-Add Update Audit Log**: Track assignments
- Log phase assignments
- Include item type
- Store old phase_id
- Store new phase_id
- Add user information
- Dependencies: T378
- Estimated Time: 5 minutes

## Webhook Integration

**T380-Create Webhook Route**: Set up endpoint
- Create `/api/webhooks/phase-update/route.ts`
- Add POST handler
- Parse request body
- Validate webhook data
- Return success response
- Dependencies: T379
- Estimated Time: 5 minutes

**T381-Add Webhook Environment**: Configure URL
- Add N8N_PHASE_UPDATE_WEBHOOK_URL to env
- Set placeholder value
- Document in .env.example
- Add to deployment docs
- Dependencies: T380
- Estimated Time: 3 minutes

**T382-Forward to n8n**: Send webhook data
- Check if webhook URL exists
- Prepare webhook payload
- Add timestamp and source
- Send POST request to n8n
- Handle webhook errors
- Dependencies: T381
- Estimated Time: 5 minutes

**T383-Add Webhook Logging**: Debug support
- Log incoming webhooks
- Log forwarding attempts
- Log response status
- Handle timeout scenarios
- Add error recovery
- Dependencies: T382
- Estimated Time: 5 minutes

**T384-Test Webhook Flow**: Verify integration
- Trigger phase update
- Check webhook fires
- Verify payload structure
- Test error handling
- Document webhook format
- Dependencies: T383
- Estimated Time: 5 minutes

## Query Functions

**T385-Create Phase Summary Query**: Get phase data
- Create getProjectPhases function
- Add to `src/lib/queries.ts`
- Join phases with invoices
- Join with bills
- Join with estimates
- Dependencies: T384
- Estimated Time: 10 minutes

**T386-Calculate Phase Metrics**: Aggregate data
- Sum revenue per phase
- Sum costs per phase
- Calculate profit
- Calculate margin percentage
- Count items per phase
- Dependencies: T385
- Estimated Time: 8 minutes

**T387-Get Phase Progress**: Retrieve progress
- Join with phase_progress table
- Get progress_percentage
- Default to 0 if not set
- Order by display_order
- Return complete phase data
- Dependencies: T386
- Estimated Time: 5 minutes

**T388-Create Phase List Query**: Get all phases
- Create getAllPhases function
- Select id, name, color
- Filter by is_active
- Order by display_order
- Cache results
- Dependencies: T387
- Estimated Time: 5 minutes

**T389-Create Projects Query**: Get project list
- Create getAllProjects function
- Select id and name
- Filter active projects
- Order alphabetically
- Use for assignment dropdown
- Dependencies: T388
- Estimated Time: 5 minutes

## New UI Components

**T390A-Create Float Summary Card**: Display float utilization
- Create `float-summary-card.tsx` component
- Display total float received
- Show total costs paid
- Calculate float balance
- Add utilization progress bar
- Dependencies: T389
- Estimated Time: 15 minutes

**T390B-Style Float Card**: Apply consistent styling
- Match existing KPI card design
- Add color coding for balance
- Use TrendingUp/Down icons
- Add responsive layout
- Test dark mode
- Dependencies: T390A
- Estimated Time: 8 minutes

**T390C-Create Phase Summary Table**: Build summary tab
- Create `phase-summary-table.tsx`
- Display all 17 phases
- Show estimated vs actual costs
- Calculate variance
- Add totals row
- Dependencies: T390B
- Estimated Time: 20 minutes

**T390D-Add Summary Calculations**: Implement aggregations
- Sum estimated costs
- Sum paid to date
- Sum costs due
- Calculate total variance
- Add float balance to total
- Dependencies: T390C
- Estimated Time: 10 minutes

**T390E-Create Cost Tracker Table**: Detailed view
- Create `cost-tracker-table.tsx`
- Group items by phase
- Add collapsible sections
- Show all invoice/bill details
- Calculate phase subtotals
- Dependencies: T390D
- Estimated Time: 25 minutes

**T390F-Add Cost Tracker Features**: Enhance functionality
- Add expand/collapse all
- Implement sorting options
- Add date formatting
- Show payment status
- Add export button placeholder
- Dependencies: T390E
- Estimated Time: 12 minutes

**T390G-Update Project Tabs**: Add new tabs
- Add Summary tab
- Add Cost Tracker tab
- Keep existing tabs
- Set Summary as default
- Update tab navigation
- Dependencies: T390F
- Estimated Time: 10 minutes

**T390H-Integrate Float Card**: Add to project page
- Import FloatSummaryCard
- Add above or beside KPI cards
- Pass float data props
- Query float payments
- Test responsive layout
- Dependencies: T390G
- Estimated Time: 8 minutes

## Integration with Project Page

**T390-Update Project Page**: Add phase components
- Open `/projects/[id]/page.tsx`
- Import PhaseSummaryCards
- Import ProjectTabsEnhanced
- Add to imports section
- Dependencies: T389
- Estimated Time: 3 minutes

**T391-Fetch Phase Data**: Get phase summaries
- Call getProjectPhases
- Pass project.id
- Await phase summaries
- Handle errors
- Store in variable
- Dependencies: T390
- Estimated Time: 5 minutes

**T392-Fetch All Phases**: Get phase list
- Call getAllPhases
- Await phases list
- Store for dropdowns
- Cache if possible
- Dependencies: T391
- Estimated Time: 3 minutes

**T393-Fetch All Projects**: Get projects list
- Call getAllProjects
- Await projects list
- Store for assignment
- Filter if needed
- Dependencies: T392
- Estimated Time: 3 minutes

**T394-Add Phase Cards**: Insert summary cards
- Add PhaseSummaryCards component
- Position above KPI cards
- Pass projectId prop
- Pass phases data
- Test rendering
- Dependencies: T393
- Estimated Time: 5 minutes

**T395-Replace Project Tabs**: Use enhanced version
- Remove old ProjectTabs
- Add ProjectTabsEnhanced
- Pass all required props
- Test tab functionality
- Verify data displays
- Dependencies: T394
- Estimated Time: 5 minutes

**T396-Test Integration**: Verify page works
- Load project detail page
- Check phase cards display
- Verify tabs work
- Test grouping toggle
- Check assignment popover
- Dependencies: T395
- Estimated Time: 8 minutes

## UI Polish and Styling

**T397-Update Progress Styles**: Enhance progress bars
- Add CSS variable for color
- Style progress track
- Style progress fill
- Add animation on change
- Test all phase colors
- Dependencies: T396
- Estimated Time: 5 minutes

**T398-Polish Card Shadows**: Match KPI cards
- Add consistent shadows
- Add hover effects
- Ensure dark mode works
- Test on mobile
- Fix any overflow issues
- Dependencies: T397
- Estimated Time: 5 minutes

**T399-Add Loading States**: Handle async operations
- Add skeleton loaders
- Show loading spinners
- Handle error states
- Add retry buttons
- Test slow connections
- Dependencies: T398
- Estimated Time: 8 minutes

**T400-Optimize Performance**: Improve speed
- Add React.memo where needed
- Optimize re-renders
- Cache static data
- Lazy load components
- Profile performance
- Dependencies: T399
- Estimated Time: 8 minutes

## Testing and Validation

**T401-Test Phase Assignment**: Verify assignment works
- Assign invoice to phase
- Assign bill to phase
- Assign estimate to phase
- Change phase assignment
- Verify saves correctly
- Dependencies: T400
- Estimated Time: 8 minutes

**T402-Test Progress Updates**: Verify progress tracking
- Click minus button
- Verify decreases by 5%
- Click plus button
- Verify increases by 5%
- Check bounds (0-100%)
- Dependencies: T401
- Estimated Time: 5 minutes

**T403-Test Grouping Toggle**: Verify grouping works
- Toggle group by phase ON
- Verify items grouped
- Check subtotals correct
- Toggle OFF
- Verify chronological order
- Dependencies: T402
- Estimated Time: 5 minutes

**T404-Test Unassigned Group**: Handle missing phases
- Create item without phase
- Verify appears in Unassigned
- Check Unassigned totals
- Assign phase
- Verify moves to correct group
- Dependencies: T403
- Estimated Time: 5 minutes

**T405-Test Webhook Triggers**: Verify webhook fires
- Update phase assignment
- Check webhook endpoint hit
- Verify payload correct
- Test error scenarios
- Check retry logic
- Dependencies: T404
- Estimated Time: 5 minutes

**T406-Test Audit Logging**: Verify changes logged
- Check phase updates logged
- Check progress changes logged
- Verify user_id recorded
- Check metadata complete
- Query audit logs
- Dependencies: T405
- Estimated Time: 5 minutes

**T407-Test Data Accuracy**: Verify calculations
- Check phase revenues
- Verify phase costs
- Test profit calculations
- Verify margin percentages
- Compare with database
- Dependencies: T406
- Estimated Time: 8 minutes

**T408-Test Responsive Design**: Mobile compatibility
- Test on mobile viewport
- Check cards stack properly
- Verify popover works
- Test toggle accessible
- Check touch targets
- Dependencies: T407
- Estimated Time: 5 minutes

**T409-Test Dark Mode**: Theme compatibility
- Switch to dark mode
- Check card visibility
- Verify text contrast
- Test form elements
- Check icons visible
- Dependencies: T408
- Estimated Time: 5 minutes

**T410-Cross-Browser Testing**: Browser compatibility
- Test in Chrome
- Test in Firefox
- Test in Safari
- Test in Edge
- Document any issues
- Dependencies: T409
- Estimated Time: 8 minutes

## Bug Fixes and Polish

**T411-Fix Edge Cases**: Handle special scenarios
- Test empty projects
- Test single item projects
- Test large datasets
- Fix any crashes
- Handle null values
- Dependencies: T410
- Estimated Time: 8 minutes

**T412-Optimize Queries**: Improve performance
- Review SQL queries
- Add missing indexes
- Optimize joins
- Reduce query count
- Cache where possible
- Dependencies: T411
- Estimated Time: 8 minutes

**T413-Add Error Boundaries**: Graceful failures
- Add error boundary component
- Wrap phase cards
- Wrap enhanced tabs
- Show user-friendly errors
- Log errors properly
- Dependencies: T412
- Estimated Time: 5 minutes

## Documentation

**T414-Document Phase Feature**: Update docs
- Update README if needed
- Document phase assignment
- Explain grouping toggle
- Note webhook configuration
- Add to user guide
- Dependencies: T413
- Estimated Time: 8 minutes

**T415-Document API Changes**: Technical docs
- Document new endpoints
- Document webhook format
- Update schema docs
- Add TypeScript definitions
- Update API examples
- Dependencies: T414
- Estimated Time: 5 minutes

**T416-Create Migration Guide**: For existing data
- Document migration steps
- Explain phase assignment
- Note default behaviors
- Add troubleshooting
- Include rollback steps
- Dependencies: T415
- Estimated Time: 5 minutes

## Final Testing and Completion

**T417-Full Feature Test**: Complete validation
- Test full workflow
- Create new project
- Add invoices with phases
- Update progress
- Test all toggles
- Dependencies: T416
- Estimated Time: 10 minutes

**T418-Performance Testing**: Load testing
- Test with 100+ items
- Check render performance
- Monitor memory usage
- Test concurrent updates
- Document limits
- Dependencies: T417
- Estimated Time: 8 minutes

**T419-Phase Completion**: Finalize phase
- Commit all changes
- Update phase status
- Document completion
- Note any follow-ups
- Prepare for Phase 9
- Dependencies: T418
- Estimated Time: 5 minutes

## Summary
- **Total Tasks**: 85 (T335-T419)
- **Estimated Total Time**: 8-10 hours
- **Priority**: HIGH - Core feature for construction tracking
- **Dependencies**: Phases 1-7 must be complete

## Success Metrics
- All construction phases defined and visible
- Phase assignment works for all item types
- Progress tracking updates correctly
- Grouping toggle functions properly
- Webhooks trigger on updates
- Performance remains fast
- Audit trail complete
- UI consistent with existing design

## Critical Path
T335 → T336-T344 (Schema) → T345-T354 (Cards) → T355-T361 (Assignment) → T362-T369 (Grouping) → T370-T384 (Backend) → T385-T389 (Queries) → T390A-T390H (New Components) → T390-T396 (Integration) → T401-T419 (Testing & Completion)

---

*Phase 8 implements comprehensive construction phase tracking to provide detailed project insights and progress monitoring capabilities.*