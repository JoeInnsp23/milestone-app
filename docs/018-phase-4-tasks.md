# Phase 4: Dashboard Implementation - Task Breakdown

## Overview
Complete task-oriented breakdown for building the main dashboard with Server Components, KPI cards, Recharts visualizations, and projects table matching MVP design.

## Prerequisites Check
**T115-Dashboard Prerequisites**: Verify requirements
- Confirm Phases 1-3 complete
- Check database has seed data
- Verify authentication working
- Review MVP screenshots
- Dependencies: Phase 1-3 Complete
- Estimated Time: 5 minutes

## Package Installation

**T116-Install Chart Libraries**: Add visualization dependencies
- Install `recharts`
- Install `date-fns`
- Install `@tanstack/react-table`
- Verify installations
- Dependencies: T115
- Estimated Time: 3 minutes

**T117-Install Additional Components**: Add shadcn components
- Install Badge component
- Install Table component
- Install Tabs component
- Install Select component
- Dependencies: T116
- Estimated Time: 5 minutes

## Dashboard Layout Setup

**T118-Create Dashboard Page**: Set up dashboard route
- Navigate to `src/app/(protected)/dashboard/`
- Create or update `page.tsx`
- Set up Server Component structure
- Add gradient background
- Dependencies: T117
- Estimated Time: 5 minutes

**T119-Create Dashboard Header**: Build page header matching MVP
- Add "Projects P&L Dashboard" title
- Add date range subtitle
- Add "Build By Milestone Ltd" text
- Style with white text on gradient
- Dependencies: T118
- Estimated Time: 5 minutes

**T120-Add Navigation Toggles**: Create Overview/All Projects buttons
- Create toggle button group
- Add "Overview" button (active state)
- Add "All Projects" button
- Style with MVP colors
- Dependencies: T119
- Estimated Time: 5 minutes

## KPI Cards Implementation

**T121-Create Stats Card Component**: Build reusable KPI card
- Create `src/components/dashboard/stats-card.tsx`
- Match MVP card design
- Add backdrop blur effect
- Add shadow styling
- Dependencies: T120
- Estimated Time: 8 minutes

**T122-Implement Total Projects Card**: Create first KPI
- Display total projects count
- Add "TOTAL PROJECTS" label
- Format number display
- Position in grid
- Dependencies: T121
- Estimated Time: 5 minutes

**T123-Implement Revenue Card**: Create revenue KPI
- Display total revenue
- Format as GBP currency
- Add "TOTAL REVENUE" label
- Apply consistent styling
- Dependencies: T122
- Estimated Time: 5 minutes

**T124-Implement Net Profit Card**: Create profit KPI
- Display net profit amount
- Apply green color (#10b981)
- Format as GBP currency
- Add "NET PROFIT" label
- Dependencies: T123
- Estimated Time: 5 minutes

**T125-Implement Profitable Projects Card**: Create ratio KPI
- Display "X / Y" format
- Show profitable vs total
- Add "PROFITABLE PROJECTS" label
- Complete KPI grid
- Dependencies: T124
- Estimated Time: 5 minutes

## Data Fetching Implementation

**T126-Create Dashboard Queries**: Build data fetching functions
- Update `src/lib/queries.ts`
- Add getDashboardStats function
- Add getProjectSummaries function
- Add getMonthlyMetrics function
- Dependencies: T125
- Estimated Time: 10 minutes

**T127-Implement Server Data Fetch**: Fetch data in page component
- Call queries in Server Component
- Handle async data fetching
- Process data for display
- Add error handling
- Dependencies: T126
- Estimated Time: 8 minutes

**T128-Calculate Derived Metrics**: Process dashboard data
- Calculate total revenue
- Calculate total costs
- Calculate profit margins
- Count profitable projects
- Dependencies: T127
- Estimated Time: 5 minutes

## Chart Components - Bar Chart

**T129-Create Profit Chart Component**: Build bar chart
- Create `src/components/dashboard/profit-chart.tsx`
- Set up Recharts BarChart
- Match MVP styling
- Add responsive container
- Dependencies: T128
- Estimated Time: 10 minutes

**T130-Configure Bar Chart Data**: Format chart data
- Process top 10 projects
- Sort by net profit
- Truncate long names
- Format currency values
- Dependencies: T129
- Estimated Time: 5 minutes

**T131-Style Bar Chart**: Apply MVP colors
- Use green (#10b981) for positive
- Use red (#ef4444) for negative
- Configure grid lines
- Style axis labels
- Dependencies: T130
- Estimated Time: 8 minutes

**T132-Add Chart Interactions**: Implement interactivity
- Add hover tooltips
- Format tooltip content
- Add click handlers (optional)
- Test responsiveness
- Dependencies: T131
- Estimated Time: 5 minutes

## Chart Components - Donut Chart

**T133-Create Revenue Chart Component**: Build donut chart
- Create `src/components/dashboard/revenue-chart.tsx`
- Set up Recharts PieChart
- Configure as donut style
- Add responsive container
- Dependencies: T132
- Estimated Time: 10 minutes

**T134-Configure Donut Data**: Format revenue breakdown
- Calculate cost of sales
- Calculate operating expenses
- Calculate net profit portions
- Create data array
- Dependencies: T133
- Estimated Time: 5 minutes

**T135-Style Donut Chart**: Apply MVP colors
- Use red (#ef4444) for costs
- Use orange (#fb923c) for expenses
- Use green (#10b981) for profit
- Remove borders
- Dependencies: T134
- Estimated Time: 8 minutes

**T136-Configure Chart Legend**: Add legend component
- Position legend on right
- Style legend items
- Add value labels
- Test layout
- Dependencies: T135
- Estimated Time: 5 minutes

## Projects Table Implementation

**T137-Create Table Component**: Build projects table
- Create `src/components/dashboard/projects-table.tsx`
- Use shadcn Table component
- Set up responsive wrapper
- Add card container
- Dependencies: T136
- Estimated Time: 8 minutes

**T138-Define Table Columns**: Set up column structure
- Add Project Name column
- Add Revenue column
- Add Cost of Sales column
- Add Operating Exp. column
- Add Net Profit column
- Add Margin % column
- Add Visual indicator column
- Dependencies: T137
- Estimated Time: 10 minutes

**T139-Implement Table Header**: Create table header matching MVP
- Add "All Projects Summary" title
- Add subtitle text
- Style header row
- Add column labels
- Dependencies: T138
- Estimated Time: 5 minutes

**T140-Populate Table Rows**: Display project data
- Map through projects array
- Format currency values
- Calculate and display margins
- Apply conditional colors
- Dependencies: T139
- Estimated Time: 8 minutes

**T141-Add Visual Indicators**: Implement profit bars
- Create visual profit indicator
- Scale bar width by value
- Apply green/red colors
- Match MVP design
- Dependencies: T140
- Estimated Time: 8 minutes

**T142-Make Rows Clickable**: Add navigation to details
- Add row hover effects
- Implement click handlers
- Navigate to project detail
- Style cursor pointer
- Dependencies: T141
- Estimated Time: 5 minutes

## Data Aggregation

**T143-Implement Monthly Aggregation**: Process time-series data
- Create aggregateMonthlyData function
- Group data by month
- Calculate monthly totals
- Format for charts
- Dependencies: T142
- Estimated Time: 8 minutes

**T144-Calculate Period Metrics**: Add period calculations
- Calculate current period totals
- Calculate previous period
- Calculate period changes
- Add trend indicators
- Dependencies: T143
- Estimated Time: 8 minutes

## Loading States

**T145-Create Loading Skeleton**: Build loading UI
- Create skeleton components
- Match card dimensions
- Add shimmer effect
- Apply to all sections
- Dependencies: T144
- Estimated Time: 8 minutes

**T146-Implement Suspense Boundaries**: Add React Suspense
- Wrap data components
- Add loading fallbacks
- Test loading states
- Handle errors gracefully
- Dependencies: T145
- Estimated Time: 5 minutes

## Error Handling

**T147-Add Error Boundaries**: Implement error handling
- Create error boundary component
- Catch rendering errors
- Display user-friendly messages
- Add retry functionality
- Dependencies: T146
- Estimated Time: 8 minutes

**T148-Handle Data Errors**: Manage fetch failures
- Catch query errors
- Display error states
- Add fallback data
- Log errors properly
- Dependencies: T147
- Estimated Time: 5 minutes

## Performance Optimization

**T149-Optimize Queries**: Improve database performance
- Add query result caching
- Implement connection pooling
- Optimize complex queries
- Add appropriate indexes
- Dependencies: T148
- Estimated Time: 10 minutes

**T150-Optimize Components**: Improve render performance
- Memoize expensive calculations
- Add React.memo where needed
- Lazy load heavy components
- Optimize re-renders
- Dependencies: T149
- Estimated Time: 8 minutes

## Responsive Design

**T151-Mobile Layout Optimization**: Adapt for mobile
- Stack KPI cards vertically
- Make charts responsive
- Adjust table for mobile
- Test on various devices
- Dependencies: T150
- Estimated Time: 8 minutes

**T152-Tablet Layout**: Optimize tablet view
- Adjust grid columns
- Resize charts appropriately
- Test landscape/portrait
- Fine-tune breakpoints
- Dependencies: T151
- Estimated Time: 5 minutes

## Dark Mode Support

**T153-Implement Theme Toggle**: Add dark mode
- Create theme context
- Add toggle button
- Store preference
- Apply to all components
- Dependencies: T152
- Estimated Time: 10 minutes

**T154-Update Component Styles**: Apply dark theme
- Update card backgrounds
- Adjust text colors
- Update chart colors
- Test all elements
- Dependencies: T153
- Estimated Time: 8 minutes

## Testing Tasks

**T155-Test Data Display**: Verify data accuracy
- Check KPI calculations
- Verify chart data
- Test table sorting
- Validate formatting
- Dependencies: T154
- Estimated Time: 5 minutes

**T156-Test Interactions**: Verify user interactions
- Test button clicks
- Test table row clicks
- Test chart tooltips
- Verify navigation
- Dependencies: T155
- Estimated Time: 5 minutes

**T157-Cross-Browser Testing**: Test browser compatibility
- Test in Chrome
- Test in Firefox
- Test in Safari
- Test in Edge
- Dependencies: T156
- Estimated Time: 8 minutes

## Documentation

**T158-Document Component Props**: Add prop documentation
- Document StatsCard props
- Document Chart props
- Document Table props
- Add usage examples
- Dependencies: T157
- Estimated Time: 5 minutes

**T159-Create Dashboard Guide**: Write usage documentation
- Explain data flow
- Document query functions
- Add customization notes
- Include troubleshooting
- Dependencies: T158
- Estimated Time: 5 minutes

## Final Verification

**T160-Visual Comparison**: Compare with MVP
- Check against screenshots
- Verify color matching
- Confirm layout accuracy
- Validate all elements
- Dependencies: T159
- Estimated Time: 8 minutes

**T161-Performance Audit**: Check dashboard performance
- Run Lighthouse audit
- Check load times
- Monitor bundle size
- Optimize if needed
- Dependencies: T160
- Estimated Time: 5 minutes

**T162-Phase Completion Check**: Final verification
- Review all components created
- Verify data flow working
- Check responsive design
- Commit dashboard implementation
- Dependencies: T161
- Estimated Time: 5 minutes

---

## Summary
- Total Tasks: 48 (T115-T162)
- Estimated Total Time: 6-7 hours
- Critical Path: T115 → T116-T117 → T118-T125 → T126-T128 → T129-T142 → T143-T162

## Success Criteria
- [ ] Dashboard page matches MVP design exactly
- [ ] All 4 KPI cards displaying correct data
- [ ] Bar chart showing top 10 projects
- [ ] Donut chart showing revenue breakdown
- [ ] Projects table with clickable rows
- [ ] Responsive design working
- [ ] Server Components fetching data
- [ ] All styling matching MVP screenshots