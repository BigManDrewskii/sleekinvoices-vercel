# Project TODO

## Comprehensive Template Management System

### Phase 1: Research & Architecture
- [ ] Research best-in-class invoicing systems (FreshBooks, QuickBooks, Wave, Zoho Invoice)
- [ ] Design template system architecture with clear separation of concerns
- [ ] Define user flows for template management
- [ ] Define user flows for invoice creation with templates
- [ ] Document edge cases and error scenarios

### Phase 2: Code Cleanup
- [x] Delete Templates.old.tsx duplicate file
- [x] Remove automatic initialization logic
- [x] Clean up confusing variable names
- [x] Add clear comments to all template-related code

### Phase 3: Template Library
- [x] Create 6 unique, non-duplicate pre-made templates
- [x] Add template preview thumbnails/cards
- [x] Implement "Initialize Default Templates" button (manual, not automatic)
- [x] Add empty state with clear call-to-action
- [x] Show template count and categories (preset vs custom)

### Phase 4: Template CRUD Operations
- [x] Create new template (from scratch or from preset)
- [x] Edit existing template with live preview
- [x] Delete template with confirmation
- [x] Duplicate template functionality (can use edit + save as new)
- [x] Set default template
- [x] Validate template data before save

### Phase 5: Invoice Creation Integration
- [x] Add template selector dropdown in Create Invoice form
- [x] Show template preview thumbnail in selector (color indicator)
- [x] Allow template override per invoice
- [x] Update backend to accept and store templateId
- [x] Add template selector to Edit Invoice form

### Phase 6: Invoice Preview
- [x] Add "Preview Invoice" button before finalizing (already exists)
- [x] Show full invoice with selected template applied
- [x] Allow template switching in preview mode
- [x] Template styling (colors, fonts) applied to preview

### Phase 7: Edge Cases & Error Handling
- [x] Handle user with no templates (show initialize button in empty state)
- [x] Handle deleting default template (backend prevents deletion)
- [x] Handle deleting template used by existing invoices (allowed, invoices fallback to default)
- [x] Handle network errors during template operations (tRPC error handling)
- [x] Handle invalid template data (Zod validation on backend)
- [x] Add loading states for all async operations (loading skeletons)
- [x] Add success/error toast notifications (sonner toasts)

### Phase 8: Testing & Delivery
- [x] Write comprehensive vitest tests for all flows
- [x] Test template CRUD operations (8 tests passing)
- [x] Test template field validation (4 tests passing)
- [x] Test template initialization (1 test passing)
- [x] Test all edge cases (delete default, field visibility)
- [x] All 13 tests passing
- [x] Save final checkpoint

## Console Warning Cleanup
- [x] Suppress benign ResizeObserver warnings in browser console

## Template System Cleanup
- [x] Audit database for duplicate templates
- [x] Remove duplicate templates, keep only 6 unique presets (verified: 0 duplicates found)
- [x] Verify template initialization creates no duplicates

## Icon System Overhaul
- [x] Research icon best practices (strategic vs decorative usage)
- [x] Audit current icon usage across all pages (48 files analyzed)
- [x] Choose optimal icon system (keeping Lucide React)
- [x] Define icon usage guidelines (navigation, actions, status only)
- [x] Remove decorative/unnecessary icons (10 instances removed)
- [x] Implement strategic icon placement
- [x] Ensure consistent icon sizing and spacing
## Logo Upload Feature

### Phase 1: Logo Upload UI
- [x] Create logo upload UI component in Templates editor
- [x] Add file input with drag-drop support
- [x] Add preview and remove functionality

### Phase 2: Backend S3 Upload
- [x] Implement S3 upload endpoint on backend (/api/upload/logo)
- [x] Use multer for file handling
- [x] Use @aws-sdk/client-s3 for S3 integration
- [x] Return public URL from S3

### Phase 3: Template Preview Logo Display
- [x] Update TemplatePreview component to display uploaded logo
- [x] Apply logoPosition (left/center/right) styling
- [x] Apply logoWidth setting
- [x] Show placeholder when no logo uploaded

### Phase 4: Invoice Preview Modal Logo Display
- [x] Update InvoicePreviewModal to display template logo
- [x] Apply template logo settings in invoice preview
- [x] Logo displays correctly with all header layouts

### Phase 5: PDF Generation Logo
- [x] Update server/pdf.ts to include logo from template
- [x] Apply logoUrl, logoPosition, and logoWidth in PDF
- [x] Logo renders correctly in generated PDFs

### Phase 6: Comprehensive Testing
- [x] Create 14 comprehensive vitest tests
- [x] Test logo URL storage (S3 URLs, null handling)
- [x] Test logo positioning (left, center, right)
- [x] Test logo width settings (80-200px)
- [x] Test file format support (PNG, JPG, SVG)
- [x] Test logo with template customization
- [x] Test multiple templates with different logos
- [x] All 14 tests passing


## Logo Image Optimization Feature

### Phase 1: Research and Planning
- [ ] Research image optimization best practices (compression, formats, quality)
- [ ] Evaluate Sharp library for image processing
- [ ] Plan optimization strategy (WebP conversion, quality levels, size limits)
- [ ] Design fallback format support (PNG, JPG, SVG)

### Phase 2: Dependencies
- [ ] Install Sharp library for image processing
- [ ] Configure Sharp for optimal performance
- [ ] Add TypeScript types for Sharp

### Phase 3: Optimization Utilities
- [ ] Create image optimization utility functions
- [ ] Implement WebP conversion with fallback
- [ ] Implement JPEG compression
- [ ] Implement PNG optimization
- [ ] Add file size validation and limits

### Phase 4: Upload Endpoint Integration
- [ ] Update /api/upload/logo endpoint to use optimization
- [ ] Apply optimization before S3 upload
- [ ] Return optimized image URL
- [ ] Handle optimization errors gracefully

### Phase 5: Format Support
- [ ] Support PNG format with optimization
- [ ] Support JPG/JPEG format with compression
- [ ] Support SVG format (pass-through, no compression)
- [ ] Support WebP format (pass-through)
- [ ] Add format detection and validation

### Phase 6: Testing
- [ ] Create image optimization tests
- [ ] Test WebP conversion
- [ ] Test JPEG compression
- [ ] Test PNG optimization
- [ ] Test SVG handling
- [ ] Test file size validation
- [ ] Test error handling

### Phase 7: Documentation and Delivery
- [ ] Update API documentation
- [ ] Document optimization settings
- [ ] Save checkpoint with optimization feature

## Logo Image Optimization Feature

### Phase 1: Research and Planning
- [x] Research image optimization best practices
- [x] Evaluate Sharp library for image processing
- [x] Plan optimization strategy
- [x] Design fallback format support

### Phase 2: Dependencies
- [x] Install Sharp library (v0.34.5)
- [x] Configure Sharp for optimal performance

### Phase 3: Optimization Utilities
- [x] Create image optimization utility functions
- [x] Implement WebP conversion with fallback
- [x] Implement JPEG compression (quality: 85)
- [x] Implement PNG optimization (compression: 9)
- [x] Add file size validation (5MB max)
- [x] Format detection from buffer signatures

### Phase 4: Upload Endpoint Integration
- [x] Update /api/upload/logo endpoint with optimization
- [x] Apply optimization before S3 upload
- [x] Return optimized URL with metrics
- [x] Return compression ratio and size savings

### Phase 5: Format Support
- [x] Support PNG format with optimization
- [x] Support JPG/JPEG format with compression
- [x] Support SVG format (pass-through)
- [x] Support WebP format (pass-through)
- [x] Automatic MIME type detection

### Phase 6: Testing
- [x] Create comprehensive tests (37 tests)
- [x] Test format detection
- [x] Test file validation
- [x] Test compression and optimization
- [x] Test error handling
- [x] All 37 tests passing

### Phase 7: Documentation and Delivery
- [x] Update API documentation
- [x] Document optimization settings
- [x] Document supported formats
- [x] Save checkpoint with feature


## UI/UX Improvements - Based on Professional Review

### Phase 1: High Priority Improvements

#### 1. Invoice Table Actions Redesign
- [x] Replace 6 icon buttons with Actions dropdown menu
- [x] Add proper hover states and focus indicators
- [x] Add tooltips to action buttons
- [x] Ensure accessibility with aria-labels

#### 2. Pagination Implementation
- [x] Add pagination to Invoices table (10-15 items per page)
- [x] Add pagination to Clients table (15-20 items per page)
- [x] Add page size selector (10, 25, 50, 100)
- [x] Show total count and current range
- [x] Style pagination consistently with existing buttons

#### 3. Invoice Number Improvement
- [x] Generate shorter, user-friendly invoice numbers (INV-2026-0001)
- [x] Implement truncation with ellipsis for long numbers
- [x] Add click-to-copy functionality
- [x] Add tooltip showing full invoice number

#### 4. Global Search Implementation
- [x] Add search input in navigation header
- [x] Search across invoices, clients, amounts
- [x] Show results in dropdown with categorized sections
- [x] Implement Cmd/Ctrl + K keyboard shortcut
- [x] Style consistently with existing search bars

#### 5. Dashboard Monthly Usage Enhancement
- [x] Add circular progress indicator or progress bar
- [x] Show "X of Y invoices used this month"
- [x] Add percentage display
- [x] Implement color coding (green 0-70%, yellow 70-90%, red 90-100%)
- [x] Show trend indicator if no limit exists

### Phase 2: Medium Priority Improvements

#### 6. Trend Indicators on Dashboard
- [x] Add up/down arrow icons to metric cards
- [x] Display percentage change from previous period
- [x] Use green for positive trends, red for negative
- [x] Add subtle animation on page load

#### 7. Sortable Table Columns
- [x] Add sort indicators to column headers
- [x] Enable click-to-sort functionality
- [x] Support ascending/descending toggle
- [x] Apply to: Invoice #, Client, Issue Date, Due Date, Amount, Status
- [x] Maintain sort state visually

#### 8. Settings Page Navigation
- [ ] Add sticky left sidebar with section links
- [ ] Include: Personal Info, Company Info, Logo, Email Reminders, Account Actions
- [ ] Implement smooth scroll to section
- [ ] Highlight active section based on scroll position
- [ ] Make sidebar collapsible on smaller screens

#### 9. Template Preview Enhancement
- [ ] Replace gradient images with actual invoice previews
- [ ] Use sample data (fictional company, client, line items)
- [ ] Show thumbnail that expands to full preview
- [ ] Add "Preview with my data" option

#### 10. Breadcrumb Navigation
- [ ] Add breadcrumbs for deep pages
- [ ] Invoice detail: Dashboard > Invoices > INV-2026-0001
- [ ] Edit invoice: Dashboard > Invoices > INV-2026-0001 > Edit
- [ ] Client detail: Dashboard > Clients > [Client Name]
- [ ] Style with ">" separators

### Phase 3: Polish Improvements

#### 11. Keyboard Shortcuts
- [ ] Implement N: New Invoice
- [ ] Implement Cmd/Ctrl + K: Focus global search
- [ ] Implement Escape: Close modals/dropdowns
- [ ] Implement Arrow keys: Navigate tables/dropdowns
- [ ] Add keyboard shortcut help modal (? key)

#### 12. Visual Email Template Editor
- [ ] Replace raw HTML editor with WYSIWYG editor
- [ ] Support: Bold, italic, headings, links, images
- [ ] Show placeholder variables as styled tags
- [ ] Include Preview button
- [ ] Keep Edit HTML option for advanced users

#### 13. Client Avatars
- [ ] Generate initials-based avatars
- [ ] Use consistent background colors based on name hash
- [ ] Display as circular avatars in client list
- [ ] Size: 32-40px diameter

#### 14. Analytics Export
- [ ] Add Export button in Analytics header
- [ ] Support formats: CSV, PDF
- [ ] Allow export of individual charts or full report
- [ ] Include date range in filename

#### 15. Invoice Activity Log
- [ ] Add activity log section to Invoice Detail page
- [ ] Log events: Created, Sent, Viewed, Paid, Edited, Reminder Sent
- [ ] Show timestamp and user/system
- [ ] Style as timeline with icons

### Accessibility Enhancements (All Phases)
- [ ] Add visible focus states (2px green outline) to all interactive elements
- [ ] Add aria-labels to all icon-only buttons
- [ ] Ensure form inputs have associated labels
- [ ] Use icons AND text for state indicators
- [ ] Implement logical keyboard navigation
- [ ] Add skip-to-content link at top of page
- [ ] Ensure color contrast meets WCAG AA standards
- [ ] Test with screen readers

### Testing Checklist
- [ ] All existing functionality still works
- [ ] Test on desktop (1920px, 1440px, 1024px)
- [ ] Dark theme consistency maintained
- [ ] No console errors or warnings
- [ ] Keyboard navigation works for all new elements
- [ ] Screen reader announces new elements correctly
- [ ] Mobile responsiveness verified


## Responsive Logo System

### Mobile-First Logo Optimization
- [x] Create ResponsiveLogo component that switches between full logo and monogram
- [x] Add monogram logo upload field in template editor
- [x] Store monogram URL in template schema
- [x] Display full logo on desktop (md and up)
- [x] Display monogram on mobile/tablet (below md)
- [x] Update Navigation component to use responsive logo
- [ ] Update TemplatePreview component to use responsive logo
- [ ] Update InvoicePreviewModal to use responsive logo
- [ ] Update PDF generation to use appropriate logo based on context
- [x] Add tests for responsive logo switching (35 tests passing)
- [x] Test with various logo and monogram sizes


## Comprehensive Brand Asset System

### Favicon & Web Manifest Integration
- [x] Copy all favicon files to public directory (favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png)
- [x] Copy Android Chrome icons (192x192, 512x512) to public directory
- [x] Copy site.webmanifest to public directory
- [x] Update index.html with favicon meta tags and manifest link
- [x] Configure web app manifest for PWA support

### Logo Variations Organization
- [x] Copy Wide logo (SVG + PNG variants @1x, @2x, @3x) to public/logos/wide/
- [x] Copy Compact logo (SVG + PNG variants @1x, @2x, @3x) to public/logos/compact/
- [x] Copy Monogram White (SVG + PNG variants @1x, @2x, @3x) to public/logos/monogram/
- [x] Create logo asset constants file (logoAssets.ts)
- [x] Document logo usage guidelines and breakpoints

### Responsive Logo System Enhancement
- [x] Update ResponsiveLogo component to use new logo asset system
- [x] Implement srcset for high-DPI displays (@2x, @3x)
- [x] Add fallback chain: SVG → PNG @1x → PNG @2x
- [x] Optimize image loading with lazy loading attributes
- [x] Test across all device pixel ratios (1x, 2x, 3x)
- [x] Implement two-breakpoint system (desktop full logo, mobile/tablet monogram)
- [x] Update breakpoint to 768px (md) for clean transition

### Navigation & Header Branding
- [x] Update Navigation component to use optimized logo variants
- [x] Implement responsive logo switching based on viewport width
- [x] Add brand name visibility on desktop (md+)
- [x] Hide brand name on mobile for space efficiency
- [x] Ensure proper spacing and alignment

### Invoice & Template Branding
- [ ] Update TemplatePreview to use new logo system
- [ ] Update InvoicePreviewModal to use new logo system
- [ ] Update PDF generation to use optimized logos
- [ ] Implement logo selection in template editor
- [ ] Add preview of selected logo variant

### PWA & Mobile App Integration
- [x] Configure web app manifest (name, description, icons, colors)
- [x] Set theme color for browser UI
- [x] Configure display mode (standalone)
- [x] Set start URL and scope
- [ ] Test PWA installation on mobile devices

### Brand Consistency Testing
- [x] Test favicon display in browser tabs (57 tests passing)
- [ ] Test Apple touch icon on iOS home screen
- [ ] Test Android Chrome icons on Android devices
- [x] Verify logo display across all breakpoints (57 tests passing)
- [x] Test high-DPI displays (2x, 3x pixel ratios) (57 tests passing)
- [ ] Verify logo rendering in dark mode
- [ ] Test logo rendering in light mode (if applicable)


## Logo Breakpoint Adjustment

- [x] Fix awkward logo display at 860px width
- [x] Lower breakpoint to 900px for better fit
- [x] Test logo display across all intermediate widths (640-1280px)
- [x] Ensure monogram displays at 860px and below


## Analytics Page UI/UX Enhancement

### Phase 1: Dashboard Layout Redesign
- [ ] Review current analytics page structure and components
- [ ] Design cleaner, more intuitive dashboard layout
- [ ] Implement responsive grid system for metrics cards
- [ ] Add visual hierarchy with proper spacing and typography
- [ ] Create consistent color scheme for data visualization

### Phase 2: Key Metrics Cards
- [ ] Create enhanced metric cards with icons and trends
- [ ] Add sparkline charts to metric cards for quick trends
- [ ] Implement color-coded status indicators (green/yellow/red)
- [ ] Add tooltips with detailed metric explanations
- [ ] Show period-over-period comparisons

### Phase 3: Data Visualization
- [ ] Enhance revenue trend chart with better styling
- [ ] Add invoice status breakdown chart (pie/donut)
- [ ] Create payment method distribution visualization
- [ ] Implement client activity heatmap or timeline
- [ ] Add export functionality for charts

### Phase 4: Filters & Time Range
- [ ] Add date range picker component
- [ ] Implement quick filters (This Month, Last 3 Months, Year-to-Date)
- [ ] Add invoice status filter
- [ ] Create client filter with search
- [ ] Add payment method filter

### Phase 5: Performance & UX
- [ ] Implement skeleton loading states for cards
- [ ] Add smooth animations for chart transitions
- [ ] Optimize data fetching and caching
- [ ] Add empty states with helpful guidance
- [ ] Implement responsive design for mobile/tablet

### Phase 6: Accessibility & Testing
- [ ] Ensure keyboard navigation works throughout
- [ ] Add ARIA labels for charts and metrics
- [ ] Test with screen readers
- [ ] Create comprehensive tests for analytics logic
- [ ] Verify color contrast ratios


## Analytics Page UI/UX Enhancements

### Dashboard Layout Redesign
- [x] Create cleaner header with title and description
- [x] Add date range filter with quick presets
- [x] Reorganize metric cards for better visual hierarchy
- [x] Implement responsive grid layout (1-4 columns)
- [x] Add refresh button with loading state

### Data Visualization & Chart Enhancements
- [x] Upgrade Revenue Over Time to Area Chart with gradient
- [x] Improve Invoice Status pie chart with better colors
- [x] Add Invoice Volume bar chart with rounded corners
- [x] Enhance Cash Flow Projection with multiple lines
- [x] Update Revenue vs Expenses with stacked bars
- [x] Improve chart tooltips with currency formatting
- [x] Add chart animations on load

### Key Metrics Cards & Summary Statistics
- [x] Create AnalyticsMetricCard component with trends
- [x] Add trend indicators (up/down arrows)
- [x] Implement color coding for different metrics
- [x] Add subtitle support for context
- [x] Create Financial Overview section (Revenue/Expenses/Profit)
- [x] Add color-coded profit display (green/red)

### Filters, Time Range Selection & Data Refinement
- [x] Create AnalyticsDateRangeFilter component
- [x] Add 4 preset date ranges (7d, 30d, 90d, 1y)
- [x] Implement mobile-friendly select dropdown
- [x] Add desktop button group for quick selection
- [x] Ensure responsive behavior

### Performance Optimization & Loading States
- [x] Add skeleton loaders for charts
- [x] Implement smooth transitions between states
- [x] Optimize chart rendering performance
- [x] Add empty state messages
- [x] Implement proper error handling

### Testing & Verification
- [x] Create 62 comprehensive tests for analytics components
- [x] Test metric card display and styling
- [x] Test date range filter functionality
- [x] Test dashboard layout responsiveness
- [x] Test data visualization and formatting
- [x] Test aging report and client profitability
- [x] Test financial overview calculations
- [x] All 62 tests passing
