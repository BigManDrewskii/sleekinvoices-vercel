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


## Analytics Page Refinement (Design System Compliant)

### Phase 1: Research & Analysis
- [x] Research analytics dashboard best practices (FreshBooks, QuickBooks, Wave, Stripe)
- [x] Study what metrics matter most for invoice management
- [x] Document current design system constraints (colors, typography, spacing)
- [x] Identify redundant/repetitive elements in current Analytics page

### Phase 2: Metric Prioritization
- [x] Define essential metrics only (remove redundant data)
- [x] Determine which infographics genuinely aid understanding
- [x] Create hierarchy of information importance

### Phase 3: Implementation
- [x] Implement refined Analytics page following design system exactly
- [x] Use only existing design tokens and components
- [x] Add purposeful infographics where needed (not decorative)
- [x] Ensure clean, readable layout

### Phase 4: Testing & Delivery
- [x] Verify all changes respect design system
- [x] Test responsiveness
- [x] Deliver refined Analytics page


## Design System Overhaul - tweakcn Theme Implementation

### Phase 1: Extract Design Tokens
- [x] Visit tweakcn theme page and extract exact color values
- [x] Document all color tokens (background, foreground, primary, secondary, etc.)
- [x] Note chart colors and visualization styling
- [x] Document card styling, borders, and shadows

### Phase 2: Update CSS Design System
- [x] Update index.css with tweakcn color values
- [x] Apply proper OKLCH color format
- [x] Update chart colors for professional look
- [x] Ensure all semantic colors are properly defined

### Phase 3: Refine Analytics Page
- [x] Apply new design system to Analytics page
- [x] Update chart styling to match tweakcn mockups
- [x] Improve card layouts and spacing
- [x] Add professional area charts like in mockups

### Phase 4: Update Other Pages
- [x] Update Dashboard with new design
- [x] Update Navigation styling
- [x] Update all cards and components
- [x] Ensure consistency across entire app

### Phase 5: Test and Deliver
- [x] Verify all pages match design system
- [x] Test responsiveness
- [x] Deliver refined design


## Analytics & Dashboard Improvements

### Invoice Status UI Fix
- [x] Fix Invoice Status infographic to match tweakcn design
- [x] Improve with horizontal progress bars and status badges

### Real Trend Data
- [x] Calculate actual period-over-period changes
- [x] Replace hardcoded percentages with real data
- [x] Add trend comparison logic to backend (getInvoiceStats)

### Sparkline Mini-Charts
- [x] Add sparkline charts to stat cards (via Recharts AreaChart)
- [x] Show revenue trend inline in Revenue Trend section

### Invoices Table Styling
- [x] Update status badges with tweakcn styling (subtle bg colors)
- [x] Update payment badges with tweakcn styling
- [x] Clean row styling with proper borders


## Analytics Page Enhancement - Graphics & Missing Features

### Phase 1: Research & Analysis
- [x] Research professional invoice analytics dashboards (FreshBooks, QuickBooks, Wave, Stripe)
- [x] Identify essential metrics for invoice management
- [x] Document missing features and improvement opportunities

### Phase 2: Graphics Improvements
- [x] Improve Revenue Trend chart with better styling and tooltips
- [x] Enhance Invoice Status visualization
- [x] Add more meaningful data visualizations
- [x] Improve chart colors and gradients

### Phase 3: Missing Features
- [x] Add Top Clients by Revenue section
- [x] Add Payment Timeline / Average Days to Pay metric (DSO)
- [x] Add Collection Rate metric
- [x] Add Avg. Invoice Value metric
- [x] Improved Receivables Aging with card layout

### Phase 4: Testing & Delivery
- [x] Test all new visualizations
- [x] Verify data accuracy
- [x] Deliver enhanced Analytics page


## Landing Page Modernization

### Phase 1: Logo & Assets
- [x] Copy new monogram logo (SVG) to public folder
- [x] Update logo component to use larger monogram version
- [x] Audit current landing page structure

### Phase 2: Floaty Navbar
- [x] Create fixed position navbar with backdrop blur
- [x] Add subtle border and shadow on scroll
- [x] Ensure smooth scroll behavior
- [x] Mobile responsive hamburger menu

### Phase 3: Hero Section Redesign
- [x] Remove current hero graphic
- [x] Create clean, minimal hero with strong typography
- [x] Add badge and trust indicators
- [x] Update CTA buttons with rounded pill styling

### Phase 4: Section Updates
- [x] Add Stats section (10K+, $2M+, 98%, 24h)
- [x] Update Features section with icon cards (6 features)
- [x] Update How It Works section (3 numbered steps)
- [x] Update Pricing section with tweakcn card design (Free vs Pro)
- [x] Add FAQ section in 2-column grid
- [x] Add Final CTA with gradient background
- [x] Update Footer with logo and links

### Phase 5: Final Polish
- [x] Test all sections render correctly
- [x] Verify tweakcn theme consistency
- [x] Deliver modernized landing page


## Sleeky Mascot Integration
- [x] Copy Sleeky mascot SVG and PNG to public folder
- [x] Add Sleeky image to hero section above headline
- [x] Responsive sizing (h-32 sm:h-40 md:h-48)


## Landing Page Polish
- [x] Add floating animation to Sleeky in hero section
- [x] Add floating animation to Sleeky in footer section
- [x] Hide scrollbar globally
- [x] Match footer max-width to navbar while keeping Sleeky position


## Template Editor Enhancements

### Brand Color Presets
- [x] Add 8 color preset buttons (Ocean, Forest, Sunset, Berry, Slate, Rose, Indigo, Teal)
- [x] Each preset shows 3 color swatches (primary, secondary, accent)
- [x] One-click application of entire color scheme
- [x] Presets displayed in a grid layout in Colors tab

### Font Pairing Suggestions
- [x] Add 6 recommended font pairings (Modern Clean, Classic Elegance, Bold Statement, Professional, Friendly, Traditional)
- [x] Each pairing shows heading + body font combination
- [x] One-click application of both fonts
- [x] Pairings displayed in Typography tab

### Live Preview
- [x] Real-time invoice preview updates as settings change
- [x] Preview shows actual template styling (colors, fonts, layout)
- [x] Preview visible alongside editor for immediate feedback



## Templates Page Redesign (User Feedback)

### Issues Identified
- [x] Gradient preview looks archaic and outdated
- [x] Button at line 169 does not work (New Template button)
- [x] Template cards need modern, professional design

### Redesign Tasks
- [x] Replace gradient previews with actual invoice thumbnail previews (MiniInvoicePreview component)
- [x] Modernize template card design (cleaner, more professional)
- [x] Fix non-working buttons (New Template button condition fixed)
- [x] Improve overall visual hierarchy and spacing
- [x] Add hover states and micro-interactions
- [x] Test all template actions work correctly



## Template Editor Elegant Redesign (User Feedback)

### UI Improvements (Inspired by Reference Images)
- [x] Create collapsible accordion sections for better organization
- [x] Add background color option for invoice
- [x] Redesign color inputs with sleek dark containers (swatch + hex input)
- [x] Add sliders for fine-tuning (letter spacing, font size, line height)
- [x] Improve typography controls with font categories (sans-serif, serif, monospace)
- [x] Add more color presets in a grid layout (20 colors)
- [x] Make preview window more elegant with backdrop blur and subtle background
- [x] Add Primary/Secondary color sections with foreground options



## HSL Adjustment Sliders (User Request)

### Features to Implement
- [x] Create HSL Adjustments collapsible section in template editor
- [x] Add Hue Shift slider (-180 to 180 degrees)
- [x] Add Saturation Multiplier slider (0 to 2x)
- [x] Add Lightness Multiplier slider (0 to 2x)
- [x] Implement hex-to-HSL and HSL-to-hex conversion utilities (hsl-utils.ts)
- [x] Apply HSL adjustments to all template colors in real-time
- [x] Store HSL adjustment values in template settings (adjusted colors saved)
- [x] Update live preview with HSL-adjusted colors
- [x] Add color preview swatches showing original vs adjusted
- [x] Add Reset to defaults button


## Sleek - Default Template (Focused Approach)

### Research Phase
- [ ] Research best practices for invoice template editors
- [ ] Study Google Fonts API integration patterns
- [ ] Analyze successful invoice template designs

### Google Fonts Integration
- [x] Implement Google Fonts API integration (google-fonts.ts)
- [x] Create font picker component with search/filter (google-font-picker.tsx)
- [x] Add font weight/style options (Light, Regular, Medium, Bold, etc.)
- [x] Implement font preview in selector
- [x] Handle font loading and caching

### Sleek Default Template Design
- [ ] Design minimalist template matching SleekInvoices brand
- [ ] Create fully dynamic template with all editable fields
- [ ] Implement clean, professional invoice layout
- [ ] Ensure responsive design for PDF export

### Editor Sidebar (Accordion-Based)
- [ ] Streamline accordion sections for clarity
- [ ] Implement simple 4-color system (Primary, Secondary, Accent, Background)
- [ ] Integrate Google Fonts picker with weight options
- [ ] Add layout and field visibility controls
- [ ] Create intuitive user experience

### Live Preview
- [ ] Side-by-side layout (editor left, preview right)
- [ ] Real-time updates as settings change
- [ ] Accurate representation of final invoice


## Sleek - Default Template (User Request - Jan 5, 2026)

### Requirements
- Minimalist design matching SleekInvoices brand identity
- Fully dynamic and editable
- Accordion-based editor sidebar
- Side-by-side layout (editor left, preview right)
- Full Google Fonts library with weight options
- Simple 4-color system (Primary, Secondary, Accent, Background)

### Template Design
- [x] Create "Sleek - Default" template component (SleekDefaultTemplate.tsx)
- [x] Minimalist design matching SleekInvoices brand
- [x] Fully dynamic and editable fields
- [x] Clean, professional layout

### Google Fonts Integration
- [x] Implement Google Fonts service (google-fonts.ts)
- [x] Create font picker component with search/filter (google-font-picker.tsx)
- [x] Add font weight/style options (Thin to Black, 100-900)
- [x] Implement font preview in selector
- [x] Handle font loading and caching
- [x] 100+ fonts available (Inter, Roboto, Playfair Display, etc.)

### Editor Sidebar
- [x] Create new SleekTemplateEditor component (SleekTemplateEditor.tsx)
- [x] Accordion-based organization (Brand Identity, Colors, Typography, Layout, Field Visibility, Footer)
- [x] Side-by-side layout (editor left, preview right)
- [x] Simple 4-color system (Primary, Secondary, Accent, Background)
- [x] 10 brand color presets (Ocean, Forest, Sunset, Berry, Slate, Rose, Indigo, Teal, Midnight, Charcoal)

### Live Preview
- [x] Real-time invoice preview with all customizations
- [x] Font changes update immediately
- [x] Color changes update immediately
- [x] Layout changes update immediately


## Single Template Focus (User Request - Jan 5, 2026)

### Requirements
- Remove all old preset templates (Modern, Classic, Minimal, Bold, Professional, Creative)
- Show only "Sleek - Default" as the single template
- Allow users to create custom templates based on Sleek - Default

### Tasks
- [ ] Update template initialization to only create "Sleek - Default"
- [ ] Update Templates page to remove preset templates section
- [ ] Simplify UI to focus on single template customization
- [ ] Update backend to use Sleek - Default as the only preset


## Template Cleanup and Preview Redesign (User Request - Jan 5, 2026)

### Tasks
- [x] Delete all old templates (Modern, Classic, Minimal, Bold, Professional, Creative)
- [x] Redesign template preview card to be minimal and elegant (TemplatePreviewCard.tsx)
- [x] Show key colors as swatches instead of PDF preview
- [x] Add "Aa" typography demonstration
- [x] Remove janky PDF preview from template cards


## Live Font Preview (User Request - Jan 5, 2026)

### Tasks
- [x] Add live font preview in Google Font picker dropdown
- [x] Show sample invoice text (e.g., "INVOICE", "$1,234.56") when hovering over fonts
- [x] Ensure live preview updates immediately when font is selected
- [x] Load fonts dynamically for preview before selection
- [x] Separate preview types for heading vs body fonts
- [x] Expanded font picker with side-by-side preview panel


## Competitor Crush Roadmap (User Request - Jan 5, 2026)

### Phase 1: Crypto Foundation & Compliance
- [ ] Create payment_gateways table (provider, config JSONB, is_enabled)
- [ ] Update invoices table for high-decimal precision (DECIMAL 24,8)
- [ ] Update invoiceLineItems table for high-decimal precision
- [ ] Add vatNumber field to clients table
- [ ] Add taxExempt field to clients table
- [ ] Update ClientDialog.tsx with VAT/Tax ID field
- [ ] Implement decimal.js for precise calculations
- [ ] Add dynamic currency symbol logic ($ → Ξ for ETH, ₿ for BTC)
- [ ] Update invoice form to allow 8 decimal places for crypto

### Phase 2: Payment Architecture ("Get Paid")
- [ ] Create Settings "Payment Connections" tab UI
- [ ] Implement Stripe custom keys section
- [ ] Implement Coinbase Commerce section with API key input
- [ ] Implement Manual Wallet section with address + network
- [ ] Create paymentGateways tRPC router (list, create, update, delete)
- [ ] Implement Coinbase Commerce charge creation
- [ ] Implement Coinbase Commerce webhook handler
- [ ] Implement manual wallet "Marked Paid" workflow
- [ ] Secure API key encryption/storage

### Phase 3: Public Invoice Experience
- [ ] Add "Pay with Crypto" button to invoice public view
- [ ] Implement QR code generation for wallet addresses
- [ ] Add "viewed" status to invoice status enum
- [ ] Implement link tracking middleware (/track/invoice/:id)
- [ ] Send notification when invoice is viewed
- [ ] Add Crypto QR Code toggle to template settings
- [ ] Display VAT number on invoice PDF
- [ ] Add dynamic payment instructions section


## Phase 2: Backend API - Crypto Subscription Duration Support (COMPLETED)

- [x] 2.1 Add subscriptionEndDate column to users table
- [x] 2.2 Add subscriptionSource column to users table  
- [x] 2.3 Add months column to cryptoSubscriptionPayments table
- [x] 2.4 Add isExtension column to cryptoSubscriptionPayments table
- [x] 2.5 Run database migration
- [x] 2.6 Add CRYPTO_SUBSCRIPTION_TIERS constants to shared/subscription.ts
- [x] 2.7 Add getCryptoTierByMonths helper function
- [x] 2.8 Add getCryptoPrice helper function
- [x] 2.9 Add getCryptoSavings helper function
- [x] 2.10 Create server/lib/subscription-utils.ts with date helpers
- [x] 2.11 Update createCryptoCheckout mutation to accept months parameter
- [x] 2.12 Create extendCryptoSubscription mutation for Pro users
- [x] 2.13 Update NOWPayments webhook to handle duration-based payments
- [x] 2.14 Update getStatus query with daysRemaining and timeRemaining
- [x] 2.15 Write unit tests for pricing calculations
- [x] 2.16 Write unit tests for subscription date utilities


## Phase 3: Frontend UI - Crypto Subscription Duration Selector

- [x] 3.1 Create CryptoDurationSelector component with pricing tier cards
- [x] 3.2 Add savings percentage badges and visual indicators
- [x] 3.3 Update CryptoSubscriptionDialog to use duration selector
- [x] 3.4 Add network selection (BSC, Polygon, Ethereum)
- [x] 3.5 Update Subscription page with "Extend with Crypto" for Pro users
- [x] 3.6 Add subscription end date display for crypto subscribers
- [x] 3.7 Add expiring soon warning banner
- [x] 3.8 Test duration selection and checkout flow


## Phase 4: Webhook, Expiration Display & Email Notifications

### 4.1 NOWPayments Webhook Updates
- [x] 4.1.1 Parse duration from order_id (format: sub_userId_Xmo_timestamp)
- [x] 4.1.2 Calculate subscription end date based on duration
- [x] 4.1.3 Handle extensions vs new subscriptions
- [x] 4.1.4 Update user subscriptionEndDate and subscriptionSource

### 4.2 Subscription Expiration Display
- [x] 4.2.1 Update getStatus query to return end date info
- [x] 4.2.2 Create ExpirationWarningBanner component
- [x] 4.2.3 Add end date display to Subscription page
- [x] 4.2.4 Show warning banner when expiring within 7 days

### 4.3 Email Notifications
- [x] 4.3.1 Create subscription confirmation email template
- [x] 4.3.2 Send email on successful crypto payment
- [x] 4.3.3 Include subscription details and end date in email

### 4.4 Testing
- [x] 4.4.1 Write webhook handler tests
- [x] 4.4.2 Test expiration display
- [x] 4.4.3 Test email sending


## Phase 5: Subscription History Page

### 5.1 Backend API
- [x] 5.1.1 Create getHistory query to fetch all subscription payments
- [x] 5.1.2 Include crypto payments from cryptoSubscriptionPayments table
- [x] 5.1.3 Include Stripe payments from subscription events
- [x] 5.1.4 Return combined timeline sorted by date

### 5.2 Frontend Page
- [x] 5.2.1 Create SubscriptionHistory page component
- [x] 5.2.2 Display payment timeline with dates and amounts
- [x] 5.2.3 Show payment method (Stripe vs Crypto)
- [x] 5.2.4 Display subscription duration for each payment
- [x] 5.2.5 Add status badges (completed, pending, failed)

### 5.3 Navigation
- [x] 5.3.1 Add route in App.tsx
- [x] 5.3.2 Add link from Subscription page

### 5.4 Testing
- [x] 5.4.1 Write API tests for getHistory
- [x] 5.4.2 Test empty state display


## Audit Phase 1: Quick Wins

### 1.1 Fix Upgrade to Pro Banner
- [x] 1.1.1 Update Dashboard to hide upgrade banner for Pro users
- [x] 1.1.2 Check subscription status before rendering banner

### 1.2 Add Skeleton Loaders
- [x] 1.2.1 Create SkeletonCard component for stats
- [x] 1.2.2 Replace "..." loading text with skeleton loaders
- [x] 1.2.3 Add skeleton for Recent Invoices section

### 1.3 Fix Duplicate Invoice Numbers
- [x] 1.3.1 Investigate duplicate invoice number issue
- [x] 1.3.2 Add unique constraint validation on invoice creation
- [x] 1.3.3 Auto-increment invoice numbers properly

### 1.4 Add Bulk Actions for Invoices
- [x] 1.4.1 Add checkbox column to invoice table
- [x] 1.4.2 Add "Select All" checkbox in header
- [x] 1.4.3 Add bulk actions dropdown (Delete)
- [x] 1.4.4 Implement bulk delete mutation
- [x] 1.4.5 Add confirmation dialog for bulk actions

### 1.5 Clean Up Template Variations
- [x] 1.5.1 Investigate duplicate "Professional Blue" templates
- [x] 1.5.2 Add deduplication logic or cleanup script
- [ ] 1.5.3 Prevent duplicate template creation



## Audit Phase 2: Core Features

### 2.1 Products/Services Library
- [x] 2.1.1 Create products table in database schema
- [x] 2.1.2 Add CRUD operations for products in db.ts
- [x] 2.1.3 Create tRPC router for products
- [x] 2.1.4 Build Products management page UI
- [x] 2.1.5 Add product selector to invoice creation form
- [x] 2.1.6 Support quick-add from invoice form

### 2.2 Recurring Invoices (Already Implemented)
- [x] 2.2.1 Create recurringInvoices table in schema
- [x] 2.2.2 Add recurring invoice CRUD operations
- [x] 2.2.3 Create tRPC router for recurring invoices
- [x] 2.2.4 Build Recurring Invoices management page
- [x] 2.2.5 Verify invoice generation logic works (existing)
- [x] 2.2.6 Test cron job for automatic generation (existing)
### 2.3 Report Export
- [x] 2.3.1 Add CSV export for invoice list
- [x] 2.3.2 Add CSV export for analytics report
- [x] 2.3.3 Include summary metrics in exports
- [x] 2.3.4 Create export UI on Analytics page

### 2.4 Testing
- [x] 2.4.1 Write tests for products CRUD
- [x] 2.4.2 Write tests for recurring invoices (existing)
- [x] 2.4.3 Write tests for report export (frontend only)



---

## Phase 3: Client Import, Partial Payments, Estimates/Quotes

### 3.1 Client CSV Import
- [x] 3.1.1 Create CSV parser utility for client data
- [x] 3.1.2 Add import endpoint with validation
- [x] 3.1.3 Build CSV import dialog with file upload
- [x] 3.1.4 Add preview table showing parsed data
- [x] 3.1.5 Handle duplicate detection and error reporting
- [x] 3.1.6 Add sample CSV template download

### 3.2 Partial Payments
- [x] 3.2.1 Update payments table schema for partial payments
- [x] 3.2.2 Add recordPartialPayment mutation
- [x] 3.2.3 Calculate remaining balance on invoices
- [x] 3.2.4 Update invoice status logic (partial vs paid)
- [x] 3.2.5 Build partial payment recording UI
- [x] 3.2.6 Show payment history on invoice view

### 3.3 Estimates/Quotes
- [x] 3.3.1 Create estimates table in database schema
- [x] 3.3.2 Add estimates CRUD operations
- [x] 3.3.3 Build estimates list page
- [x] 3.3.4 Build create/edit estimate form
- [x] 3.3.5 Add convert-to-invoice functionality
- [ ] 3.3.6 Add estimate PDF generation (future)
- [ ] 3.3.7 Add estimate email sending (future)

### 3.4 Testing
- [x] 3.4.1 Write tests for CSV import
- [x] 3.4.2 Write tests for partial payments
- [x] 3.4.3 Write tests for estimates logic
- [ ] 3.4.3 Write tests for estimates CRUD
- [ ] 3.4.4 Write tests for estimate-to-invoice conversion


---

## Phase 4: Strategic Analysis & UI/UX Overhaul

### 4.1 Navigation & UI/UX Improvements
- [ ] 4.1.1 Evaluate navbar structure - primary vs secondary features
- [ ] 4.1.2 Implement grouped navigation with dropdown menus
- [ ] 4.1.3 Add quick actions menu for common tasks
- [ ] 4.1.4 Improve mobile navigation experience

### 4.2 Landing Page Updates
- [ ] 4.2.1 Remove placeholder testimonials
- [ ] 4.2.2 Update hero copy with competitive positioning
- [ ] 4.2.3 Add feature comparison section vs competitors
- [ ] 4.2.4 Highlight crypto payments differentiator
- [ ] 4.2.5 Add AND.CO migration messaging

### 4.3 Strategic Gap Analysis
- [x] 4.3.1 Audit current features vs competitor research
- [x] 4.3.2 Identify missing essential features
- [x] 4.3.3 Prioritize competitive advantage features
- [x] 4.3.4 Create phased implementation roadmap

---
## Guided Invoice Creator (Typeform-style)

### Phase 1: Architecture & Design
- [x] Create GuidedInvoiceCreator page component
- [x] Design step flow: Client → Services → Amounts → Due Date → Review
- [x] Create reusable QuestionStep component with animations
- [x] Design progress indicator component

### Phase 2: Question Components
- [x] ClientStep: Select existing or create new client inline
- [x] ServicesStep: Add line items with descriptions
- [x] AmountsStep: Quantity, rate, tax configuration
- [x] DueDateStep: Payment terms and due date selection
- [x] ReviewStep: Summary with edit capabilities

### Phase 3: Data & Generation
- [x] Implement step state management with useReducer
- [x] Connect to existing client/invoice tRPC procedures
- [x] Auto-save draft as user progresses
- [x] Generate invoice on completion

### Phase 4: Polish & UX
- [x] Keyboard navigation (Enter to advance, Escape to go back)
- [x] Smooth slide/fade transitions between steps
- [x] Mobile-responsive design
- [x] Exit confirmation dialog

### Phase 5: Testing & Delivery
- [x] Write vitest tests for guided flow (11 tests passing)
- [x] Test all step transitions
- [x] Add entry point to navigation/dashboard
- [x] Save checkpoint and deliver


## UI Refinement - Manus.im Aesthetic
- [x] Refine Monthly Usage card - more compact and elegant
- [x] Improve Dashboard card styling with Manus.im aesthetic
- [x] Improve stats cards with gradient backgrounds and hover effects
- [x] Improve Recent Invoices card styling
- [x] Apply consistent elegant styling across components


## UI Consistency - Elegant Card Design
- [x] Apply elegant card styling to Invoices page
- [x] Apply elegant card styling to Clients page
- [x] Apply elegant card styling to Analytics page
- [x] Ensure consistent rounded-2xl, gradient backgrounds, and hover effects


## Navigation Redesign & Search Verification
- [x] Verify global search functionality works correctly
- [x] Redesign navigation bar with enhanced visual appeal (gradient background, backdrop blur, scroll shadow)
- [x] Optimize navigation for tablet viewports (768px-1023px) with horizontal nav and dropdowns
- [x] Optimize navigation for mobile viewports (< 768px) with hamburger menu
- [x] Improve navigation aesthetics and usability


## Invoice Creation UX Improvement
- [x] Replace separate Guided/New Invoice buttons with single "New Invoice" button
- [x] Create overlay/dialog with two choices: Smart Invoice Builder and Classic Form
- [x] Add explanations for each invoice creation method
- [x] Style Navigation "New" button with purple outline and darker fill for differentiation


## New Invoice Dialog & Button Refinement
- [x] Add AI option (Magic Invoice) to the New Invoice dialog with emerald accent
- [x] Restyle Navigation "New" button to follow design system (outline variant with primary color)


## Dashboard UI Refinement
- [x] Refine MagicInvoiceSection container with Manus.im inspired aesthetic (subtle glow on hover, refined gradients)


## Elegant Loader Implementation
- [x] Review UIverse loader design (fresh-panther-41)
- [x] Create reusable GearLoader component with size variants (sm, md, lg)
- [x] Integrate loader into app Suspense fallback
- [x] Add CSS animations (clockwise, counter-clockwise, slow rotation)
- [x] Test loader across different contexts


## Orb Component Fix
- [x] Fix orb rendering issues (gradient, sparkle icon, glass reflection, animated overlay)


## Integration Research
- [ ] Research payment processing solutions (Stripe alternatives, modern options)
- [ ] Research Whop and similar partnership/monetization platforms
- [ ] Identify strategic integrations for invoice app modernization
- [ ] Compile recommendations report


## Integration Research (Completed)
- [x] Research payment processing solutions (Paddle, LemonSqueezy, crypto payments)
- [x] Research partnership tools (Whop, PartnerStack, affiliate platforms)
- [x] Research accounting integrations (QuickBooks, Xero)
- [x] Research AI automation and e-signature integrations
- [x] Identify strategic integrations aligned with market preferences
- [x] Compile comprehensive recommendations report (see research/integration-recommendations.md)


## QuickBooks Integration

### Phase 1: Research & Architecture
- [x] Research QuickBooks Online API documentation
- [x] Study OAuth 2.0 authentication flow
- [x] Review Invoice and Customer entity structures
- [x] Design integration architecture (one-way sync: SleekInvoices → QuickBooks)

### Phase 2: Database Schema
- [x] Create quickbooksConnections table for OAuth tokens
- [x] Create quickbooksCustomerMapping table for client-customer mapping
- [x] Create quickbooksInvoiceMapping table for invoice mapping
- [x] Create quickbooksSyncLog table for audit trail
- [x] Run database migrations

### Phase 3: OAuth 2.0 Implementation
- [x] Install intuit-oauth package
- [x] Create type declarations for intuit-oauth
- [x] Implement OAuth client creation
- [x] Implement authorization URL generation
- [x] Implement token exchange
- [x] Implement token refresh
- [x] Implement connection status checking

### Phase 4: Customer Sync
- [x] Implement customer mapping lookup
- [x] Implement customer creation in QuickBooks
- [x] Implement customer update in QuickBooks
- [x] Implement sync all clients functionality
- [x] Implement client sync status checking

### Phase 5: Invoice Sync
- [x] Implement invoice mapping lookup
- [x] Implement invoice creation in QuickBooks
- [x] Implement invoice update in QuickBooks
- [x] Implement sync all invoices functionality
- [x] Implement invoice sync status checking
- [x] Implement sync history retrieval

### Phase 6: tRPC Router
- [x] Add getStatus procedure
- [x] Add getAuthUrl procedure
- [x] Add handleCallback procedure
- [x] Add disconnect procedure
- [x] Add syncClient procedure
- [x] Add syncAllClients procedure
- [x] Add syncInvoice procedure
- [x] Add syncAllInvoices procedure
- [x] Add getClientSyncStatus procedure
- [x] Add getInvoiceSyncStatus procedure
- [x] Add getSyncHistory procedure

### Phase 7: Frontend UI
- [x] Create QuickBooksSettings component
- [x] Add connection status display
- [x] Add connect/disconnect buttons
- [x] Add sync all clients button
- [x] Add sync all invoices button
- [x] Add sync history dialog
- [x] Create QuickBooksCallback page
- [x] Add route for OAuth callback
- [x] Integrate into Settings page

### Phase 8: Testing
- [x] Create comprehensive vitest tests
- [x] Test OAuth configuration check
- [x] Test OAuth client creation
- [x] Test authorization URL generation
- [x] Test API call error handling
- [x] Test customer mapping functions
- [x] Test invoice mapping functions
- [x] Test sync history retrieval
- [x] All 9 tests passing

### Phase 9: Delivery
- [x] Save checkpoint with QuickBooks integration
- [x] Request QuickBooks API credentials from user
- [x] Pass Intuit compliance questionnaire
- [x] Configure production credentials
- [x] Validate credentials with tests (5 tests passing)


## Legal Pages & QuickBooks Configuration

### Phase 1: Terms of Service Page
- [x] Create Terms of Service page component
- [x] Add route for /terms
- [x] Include standard SaaS terms content
- [x] Style consistently with landing page

### Phase 2: Privacy Policy Page
- [x] Create Privacy Policy page component
- [x] Add route for /privacy
- [x] Include GDPR-compliant privacy content
- [x] Cover QuickBooks data handling
- [x] Style consistently with landing page

### Phase 3: QuickBooks API Configuration
- [x] Configure QUICKBOOKS_CLIENT_ID secret
- [x] Configure QUICKBOOKS_CLIENT_SECRET secret
- [x] Configure QUICKBOOKS_REDIRECT_URI secret
- [x] Configure QUICKBOOKS_ENVIRONMENT secret (production)
- [x] Test OAuth flow with credentials validation

### Phase 4: Delivery
- [x] Save checkpoint with legal pages
- [x] Provide URLs for Intuit compliance form
- [x] Pass Intuit compliance review


## Legal Pages Design Refinement

### Phase 1: Design System Review
- [x] Review landing page header/footer design
- [x] Identify logo component and usage
- [x] Document color scheme and typography

### Phase 2: Page Refinement
- [x] Update Terms page to match landing page design
- [x] Update Privacy page to match landing page design
- [x] Use correct SleekInvoices logo component
- [x] Match header/footer styling with landing page

### Phase 3: Landing Page Integration
- [x] Add Terms link to landing page footer
- [x] Add Privacy link to landing page footer


## Bug Fixes - January 2026

### QuickBooks Redirect URI Fix
- [x] Check current QUICKBOOKS_REDIRECT_URI value (https://sleekinvoices.com/quickbooks/callback)
- [x] User added redirect URI to Intuit Developer Portal
- [x] OAuth flow working after fix

### Loading Spinner Standardization
- [x] Find all instances of old crescent-style spinner (13 pages)
- [x] Replace with new GearLoader cog animation component
- [x] Lower opacity to 70% on all full-page loading screens
- [x] Small inline button spinners kept as-is (appropriate for button states)


## QuickBooks Sync Enhancements

### Per-Invoice Sync Button
- [x] Add "Sync to QuickBooks" action to invoice Actions dropdown
- [x] Check if QuickBooks is connected before showing option
- [x] Show sync status indicator on invoice row (syncing spinner)
- [x] Handle sync errors gracefully with toast notifications

### Automatic Sync on Invoice Creation
- [x] Trigger QuickBooks sync when new invoice is created (status='sent')
- [x] Sync associated client first if not already synced (handled by syncInvoiceToQB)
- [x] Log sync activity to sync history (via quickbooksSyncLog table)
- [x] Handle errors without blocking invoice creation (fire-and-forget pattern)

### Automatic Sync on Invoice Send
- [x] Trigger QuickBooks sync when invoice is sent via email (draft→sent)
- [x] Log sync activity to sync history
- [x] Handle errors without blocking email sending

### Automatic Sync on Payment
- [x] Trigger QuickBooks sync when invoice is marked as paid
- [x] Update payment status in QuickBooks
- [x] Log sync activity to sync history
- [x] Handle errors gracefully (fire-and-forget pattern)

### Testing
- [x] Test per-invoice sync button functionality (12 tests)
- [x] Test automatic sync on invoice creation (3 tests)
- [x] Test automatic sync on payment (2 tests)
- [x] Test error handling (2 tests)
- [x] Test InvoiceActionsMenu integration (3 tests)
- [x] All 12 tests passing


## QuickBooks Advanced Enhancements

### Sync Status Indicators on Invoice List
- [x] Create QuickBooks sync status badge component (inline in Invoices.tsx)
- [x] Fetch sync status for invoices in list query (joined quickbooksInvoiceMapping)
- [x] Display sync indicator (icon/badge) on invoice rows (desktop and mobile)
- [x] Show last synced timestamp on hover/tooltip
- [x] Handle loading state for sync status (QB column only shows when connected)

### Two-Way Payment Sync
- [x] Research QuickBooks payment webhooks/polling options (using CDC polling)
- [x] Create endpoint to receive QuickBooks payment updates (pollPayments mutation)
- [x] Implement payment sync from QuickBooks to SleekInvoices (pollPaymentsFromQB)
- [x] Add periodic sync check for payment status (manual "Pull Payments" button)
- [x] Handle payment reconciliation conflicts (via quickbooksPaymentMapping table)

### QuickBooks Sync Settings
- [x] Create quickbooksSyncSettings database table
- [x] Add sync preferences UI in Settings page (collapsible panel)
- [x] Implement auto-sync toggle (enable/disable) for invoices and payments
- [x] Add minimum invoice amount filter for sync
- [x] Add sync frequency settings (pollIntervalMinutes)
- [x] Save and apply user preferences

### Testing
- [x] Test sync status indicator display (2 tests)
- [x] Test two-way payment sync (3 tests)
- [x] Test sync settings persistence (5 tests)
- [x] Test settings application to sync behavior (4 tests)
- [x] All 14 tests passing


## Landing Page Improvements

### Banner Refinement
- [x] Review and remove/refine obstructing banner at line 34
- [x] Ensure banner doesn't obstruct UI elements (made smaller, less intrusive)

### AND.CO Research
- [x] Research AND.CO competitor (features, positioning, pricing)
- [x] Identify key differentiators for SleekInvoices (templates, QB sync, crypto)
- [x] Apply competitive insights to landing page messaging (added AND.CO to comparison)

### Hero Section Improvements
- [x] Reduce copy - make it more concise and targeted
- [x] Apply landing page best practices (single clear CTA, social proof)
- [x] Improve visual hierarchy and clarity

### Aesthetic Improvements
- [x] Unify background - use one solid dark background (#0a0a0f)
- [x] Remove alternating background tones between sections
- [x] Improve features section aesthetic (cleaner cards with icons)
- [x] Ensure consistent visual design across all sections

### Testing
- [x] Verify all changes render correctly
- [x] Test responsive design on mobile
- [x] Ensure no UI obstructions


## Landing Page Refinements (Round 2)

- [x] Fix banner spacing - removed banner entirely (cleaner approach)
- [x] Match background color to dashboard (using theme bg-background variable)
- [x] Unify max-width across all sections (max-w-4xl, px-6 padding)
- [x] Improve overall UI for cleaner look (theme variables throughout)


## Pre-Launch Review Findings (January 8, 2026)

### Critical Issues (In Progress)
- [x] Fix settings page direct URL routing (verified - loads correctly, just slow initial load)
- [x] Update 404 page to use dark theme (skip Sleeky - user adding later)
- [ ] Clean up test data (479 clients, duplicate invoices) - User action required via Database panel
- [x] Add pagination to clients list (25 items per page, page size selector)
- [x] Verify invoice number uniqueness validation (getInvoiceByNumber in db.ts, checked in routers.ts)

### Design Inconsistencies
- [x] Standardize date format across app (formatDate in utils.ts uses consistent format)
- [x] Update Magic Invoice button styling (removed dashed border, added subtle bg)
- [x] Empty state displays use "—" consistently (acceptable for table cells)

### Feature Improvements
- [x] Reorganize settings page into tabs (Profile, Company, Reminders, Integrations)
- [ ] Add visual email template editor or syntax highlighting
- [ ] Add sorting to clients list
- [ ] Add bulk actions to clients list
- [ ] Add client revenue display
- [ ] Add template preview to invoice creation

### Landing Page
- [ ] Add testimonials section
- [ ] Add product demo video/GIF
- [ ] Create contact page
- [ ] Create privacy and terms pages
- [ ] Add Sleeky mascot to empty states and 404 page

### Mobile
- [ ] Test hamburger menu on mobile
- [ ] Verify touch targets are 44x44 pixels minimum
- [ ] Test invoice creation form on mobile
- [ ] Verify modals don't overflow on small screens


## Client Management Enhancements

### Client Sorting
- [x] Add sort dropdown/buttons for Name, Email, Date Added
- [x] Implement ascending/descending toggle
- [x] Persist sort preference in state
- [x] Update table headers to show sort indicators (clickable with icons)

### Bulk Delete
- [x] Add checkbox column to clients table
- [x] Add "Select All" checkbox in header
- [x] Add "Delete Selected" button (shows when items selected)
- [x] Implement bulk delete API endpoint
- [x] Add confirmation dialog before deletion
- [x] Show count of selected items

### Visual Email Template Editor
- [x] Create placeholder-aware textarea component (PlaceholderTextarea.tsx)
- [x] Highlight {{placeholders}} with distinct styling (green for valid, red for invalid)
- [x] Add placeholder insertion buttons/dropdown
- [x] Show live preview of template with sample data
- [x] Validate placeholder syntax (highlights invalid placeholders in red)


## Client Management Enhancements (Round 2)

### Client Search Filters
- [x] Add company filter dropdown (list unique companies)
- [x] Add tax exempt status filter (All/Tax Exempt/Not Exempt)
- [x] Add date range filter (created date)
- [x] Combine filters with existing search and sort

### Email Template Presets
- [x] Create friendly reminder template preset
- [x] Create formal reminder template preset
- [x] Create urgent reminder template preset
- [x] Add preset selector dropdown in Settings ("Use Template" button)
- [x] Allow customization after selecting preset

### Export Clients to CSV
- [x] Add "Export CSV" button to clients page
- [x] Generate CSV with all client fields (name, email, phone, company, address, VAT, tax exempt, notes, created)
- [x] Handle large datasets efficiently (client-side generation)
- [x] Include proper CSV escaping for special characters (quotes, commas, newlines)


## Advanced Features (Round 3)

### Invoice Filters
- [x] Add status filter dropdown (All/Draft/Sent/Paid/Overdue)
- [x] Add date range filter (today, week, month, quarter, year)
- [x] Add client filter dropdown (auto-populated from invoices)
- [x] Add amount range filter (min/max)
- [x] Combine filters with existing search and sort
- [x] Add collapsible advanced filters panel with badge count

### Client Tags/Categories
- [x] Create client_tags database table (clientTags + clientTagAssignments)
- [x] Add tag management UI (create, edit, delete tags with color picker)
- [x] Add tag assignment to clients (inline in table + bulk assign)
- [x] Filter clients by tags
- [x] Display tags on client cards/rows

### Batch Invoice Creation
- [x] Add multi-select mode to clients list (already exists with checkboxes)
- [x] Create batch invoice page (/invoices/batch)
- [x] Allow setting common line items for batch
- [x] Generate invoices for selected clients (sequential creation)
- [x] Show progress/results of batch creation (real-time status updates)


## Advanced Features Round 4

### Feature 1: Recurring Invoice Templates (Batch Configurations)
- [x] Create batchInvoiceTemplates database table (name, lineItems, dueInDays, templateId, notes, frequency)
- [x] Add backend CRUD operations for batch templates
- [x] Add tRPC procedures (create, list, get, update, delete)
- [x] Add "Save as Template" button on batch invoice page
- [x] Create BatchTemplateDialog for saving/naming templates
- [x] Add "Load Template" dropdown on batch invoice page
- [x] Show template list with name, line items count, frequency
- [x] Allow editing and deleting saved templates
- [x] Write tests for batch template operations (11 tests passing)

### Feature 2: Client Import from Tags on Batch Invoice Page
- [x] Add tag filter dropdown to batch invoice page
- [x] Fetch all tags for current user
- [x] Add "Select All Clients with Tag" button
- [x] When tag selected, auto-populate client selection
- [x] Show tag badges in client selection list
- [x] Allow combining tag filter with manual selection
- [x] Write tests for tag-based client selection (included in batch template tests)

### Feature 3: Invoice Export (CSV and PDF)
- [x] Add Export dropdown button to Invoices page
- [x] Implement CSV export for filtered invoice list
- [x] Include columns: Invoice #, Client, Email, Issue Date, Due Date, Amount, Status, Paid Amount
- [x] Implement PDF export for filtered invoice list
- [x] Create professional PDF report layout
- [x] Include summary stats at top (total, paid, outstanding)
- [x] Apply current filters to export
- [x] Show export progress for large datasets
- [x] Write tests for export functionality (included in UI component)

