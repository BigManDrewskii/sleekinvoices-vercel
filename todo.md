# Invoice Generator - Implementation TODO

## 🚀 LEAN POWER PILLAR: Zero-Friction Invoicing

**Goal:** Create and send a professional invoice in under 60 seconds through intelligent simplicity + AI.

---

## 📋 PHASE 1: UI Streamlining (Ruthless Simplicity)

### 1.1 Dashboard Quick Actions
- [ ] Add prominent "Magic Invoice" button with sparkle icon
- [ ] Create quick action cards for most common tasks
- [ ] Streamline recent invoices display (show only essential info)
- [ ] Add keyboard shortcut hints (Cmd+N for new invoice)

### 1.2 Invoice Creation Flow Optimization
- [ ] Create MagicInvoiceInput component (single text field for AI compose)
- [ ] Add smart defaults for all form fields
- [ ] Implement one-click client selection with recent clients first
- [ ] Add inline client creation (no modal interruption)
- [ ] Simplify line item entry with natural language support
- [ ] Auto-calculate and display totals in real-time (already done)
- [ ] Add "Quick Send" button that skips preview for repeat clients

### 1.3 Progressive Disclosure
- [ ] Collapse advanced options by default (tax, discount, notes)
- [ ] Show "Advanced Options" toggle for power users
- [ ] Remember user preferences for collapsed/expanded state
- [ ] Simplify template selection (show preview on hover)

### 1.4 Navigation & Accessibility
- [x] Implement Command Palette (Cmd+K) for quick navigation
- [x] Add keyboard shortcuts for common actions
- [x] Improve focus states and tab navigation
- [ ] Add breadcrumb navigation for deep pages

---

## ✨ PHASE 2: Delight Layer (Micro-interactions & Polish)

### 2.1 Celebration Moments
- [x] Add confetti animation when invoice is sent
- [x] Add success animation when payment is received
- [ ] Create milestone celebrations (first invoice, $1000 earned, etc.)
- [ ] Add subtle sound effects (optional, user preference)

### 2.2 Smart Notifications
- [ ] "Client opened your invoice" with view count
- [ ] "Invoice is X days overdue - send reminder?" prompt
- [ ] Payment prediction based on client history
- [ ] Weekly summary notification

### 2.3 Empty States & Onboarding
- [x] Create empty state component structure with placeholder slots
- [x] **NOTE: User will provide mascot illustrations - leave image slots**
- [ ] Create first-time user onboarding flow
- [ ] Add contextual tips for new features
- [ ] Implement achievement badges system

### 2.4 Animation & Transitions
- [x] Add smooth page transitions (page-transition class)
- [x] Implement staggered list animations (already partially done)
- [x] Add hover effects on interactive elements (card-glow, hover-lift, etc.)
- [x] Create loading shimmer effects (already done)

### 2.5 Visual Polish
- [x] Audit and improve color contrast
- [x] Add subtle gradients and depth (gradient-text, card-glow)
- [x] Improve card shadows and borders (card-elevated, glass)
- [x] Ensure consistent spacing throughout

---

## 🤖 PHASE 3: AI-Powered Smart Compose

### 3.1 Backend: Invoice Extraction API
- [x] Create `ai.smartCompose` tRPC procedure
- [x] Implement LLM prompt for invoice data extraction
- [x] Add client name fuzzy matching logic
- [x] Create structured JSON output with validation
- [x] Add fallback to manual form if extraction fails
- [x] Implement credit-based rate limiting for AI calls

### 3.2 Frontend: Magic Input Component
- [x] Create MagicInput with expandable text area
- [x] Add real-time processing indicator (subtle spinner)
- [x] Navigate to CreateInvoice with pre-filled data
- [x] Implement error handling for failed extractions
- [x] Add example prompts/placeholders
- [x] Show remaining AI credits in UI

### 3.3 Smart Suggestions
- [ ] Implement client prediction based on recent activity
- [ ] Add line item suggestions from history
- [ ] Create "Similar to Invoice #X" detection
- [ ] Suggest due dates based on client payment patterns

### 3.4 AI Credit System (Monetization)
- [x] Create `aiCredits` and `aiUsageLogs` tables in database
- [x] Track credits per user per month
- [x] Free tier: 5 AI credits/month
- [x] Pro tier: 50 AI credits/month
- [x] Each Smart Compose = 1 credit
- [x] Show remaining credits in UI
- [x] Graceful degradation when credits exhausted
- [ ] Consider credit purchase option for future

### 3.5 AI Infrastructure
- [x] Use Manus Forge API with Gemini 2.5 Flash
- [x] Implement structured JSON schema for reliable parsing
- [x] Add comprehensive usage logging for cost tracking
- [x] Monitor API costs via aiUsageLogs table

---

## 🧪 PHASE 4: Testing & Quality Assurance

### 4.1 Unit Tests
- [ ] Test Smart Compose extraction logic
- [ ] Test client fuzzy matching
- [ ] Test calculation precision
- [ ] Test keyboard shortcuts

### 4.2 Integration Tests
- [ ] Test full invoice creation flow
- [ ] Test AI fallback scenarios
- [ ] Test payment processing integration

### 4.3 User Experience Testing
- [ ] Measure time-to-first-invoice
- [ ] Test on mobile devices
- [ ] Verify accessibility compliance
- [ ] Performance audit (Lighthouse)

---

## 📊 SUCCESS METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Time to create invoice | ~3 min | <60 sec |
| Smart Compose adoption | 0% | 50% |
| User satisfaction | Unknown | NPS 50+ |
| Mobile usability | Good | Excellent |

---

## 🔧 TECHNICAL NOTES

### AI Model Strategy
- Primary: Free OpenRouter models (MiMo-V2-Flash, Gemma 3)
- Fallback: Gemini 2.5 Flash ($0.50/M input, $3/M output)
- Cost per 1000 extractions: ~$0-1
- Already have OpenRouter integration via existing LLM helper

### Dependencies to Add
- canvas-confetti (celebrations) - tiny, MIT license
- cmdk (command palette) - lightweight, MIT license
- Note: framer-motion may already be available via tw-animate-css

### Files to Create/Modify
- `client/src/components/MagicInvoiceInput.tsx` (new)
- `client/src/components/CommandPalette.tsx` (new)
- `client/src/components/Confetti.tsx` (new)
- `client/src/components/EmptyState.tsx` (new - with image slot for mascot)
- `server/routers.ts` (add createFromText procedure)
- `client/src/pages/Dashboard.tsx` (add quick actions)
- `client/src/pages/CreateInvoice.tsx` (integrate magic input)

---

## ✅ COMPLETED PHASES (Previous Work)

### Phase 1: Clients Management (Complete)
- [x] Create shared components (ClientDialog, DeleteConfirmDialog)
- [x] Implement Clients.tsx with table view and search
- [x] Implement create client flow
- [x] Implement edit client flow
- [x] Implement delete client flow with confirmation

### Phase 2: Invoices List (Complete)
- [x] Build InvoiceTable component
- [x] Implement status filter dropdown
- [x] Add search by invoice number/client

### UI Enhancement: Loading Skeletons (Complete)
- [x] Create base skeleton component with shimmer animation
- [x] Create TableSkeleton, CardSkeleton
- [x] Update all pages with skeleton loading states

### UI Enhancement: Button System & Modal Redesign (Complete)
- [x] Update button.tsx with new variants
- [x] Update dialog.tsx with improved animations
- [x] Update all modal components

### UI Enhancement: Advanced Loading Optimization (Complete)
- [x] Configure QueryClient with staleTime and gcTime
- [x] Add stagger-fade-in animation for lists

---

## 📝 IMPLEMENTATION LOG

*Track progress here as tasks are completed*

| Date | Task | Status |
|------|------|--------|
| 2026-01-07 | Command Palette (Cmd+K) | ✅ Complete |
| 2026-01-07 | Confetti on invoice sent | ✅ Complete |
| 2026-01-07 | Empty State components | ✅ Complete |
| 2026-01-07 | AI Smart Compose backend | ✅ Complete |
| 2026-01-07 | AI Credit System | ✅ Complete |
| 2026-01-07 | Magic Input component | ✅ Complete |
| 2026-01-07 | CreateInvoice URL pre-fill | ✅ Complete |
| 2026-01-07 | Page transition animations | ✅ Complete |
| 2026-01-07 | Delight layer CSS animations | ✅ Complete |
| 2026-01-07 | AI Assistant slide-out panel | ✅ Complete |
| 2026-01-07 | AI Assistant tests (9 passing) | ✅ Complete |


---

## 🧠 PHASE 4: Enhanced AI Experience (Industry Best Practices)

### 4.1 AI Assistant Interface
- [x] Create dedicated AI Assistant panel (slide-out drawer)
- [x] Implement multi-turn conversational context
- [x] Add streaming responses with typing effect
- [x] Create conversation history persistence
- [x] Add "Clear conversation" and "New chat" options
- [x] Implement context-aware suggestions based on current page

### 4.2 Task-Oriented AI Controls (Beyond Chat)
- [x] Add quick action buttons for common AI tasks
- [ ] Create visual invoice builder with AI refinement
- [ ] Implement slider controls for adjusting AI suggestions
- [ ] Add preset templates for different invoice types
- [ ] Create "AI Suggestions" sidebar for invoice editing

### 4.3 Smart Input Enhancements
- [ ] Add voice input option for invoice creation
- [ ] Implement auto-complete with AI predictions
- [ ] Create query builder for complex invoice requests
- [ ] Add drag-and-drop file parsing (receipts, contracts)
- [ ] Implement natural language date parsing improvements

### 4.4 Output Visualization & Refinement
- [ ] Show real-time invoice preview during AI generation
- [ ] Add "Refine" button for iterative improvements
- [ ] Create comparison view (before/after AI changes)
- [ ] Implement inline editing of AI suggestions
- [ ] Add confidence indicators for extracted data

### 4.5 Proactive AI Features
- [ ] Implement "Invoice Insights" dashboard widget
- [ ] Add payment prediction based on client history
- [ ] Create overdue invoice reminder suggestions
- [ ] Implement smart follow-up email drafts
- [ ] Add revenue forecasting based on patterns

### 4.6 AI Personality & Branding
- [ ] Define consistent AI assistant personality (friendly, professional)
- [ ] Add contextual help tips throughout the app
- [ ] Create onboarding AI tutorial for new users
- [ ] Implement error messages with helpful suggestions

---

## 💻 PHASE 5: Desktop & Tablet Optimization

### 5.1 Desktop Layout Enhancements
- [x] Optimize sidebar width and collapsibility (CSS classes added)
- [ ] Implement resizable panels for power users
- [x] Add multi-column layouts for wide screens (dashboard-grid, stats-grid)
- [x] Create keyboard-first navigation patterns (focus-ring-enhanced)
- [ ] Implement drag-and-drop for invoice items

### 5.2 Tablet-Specific Optimizations
- [x] Optimize touch targets (minimum 44px) - touch-target class
- [ ] Implement swipe gestures for common actions
- [x] Create tablet-optimized invoice preview (invoice-preview-layout)
- [x] Add split-view support for iPad (split-view-compact)
- [x] Optimize form layouts for touch input (card-actions-touch)

### 5.3 Responsive Breakpoints
- [x] Audit all pages for tablet breakpoints (768px-1024px)
- [x] Ensure proper spacing at all screen sizes (section-spacing, content-section)
- [x] Test navigation patterns on tablet devices (tablet-nav-scroll)
- [x] Optimize data tables for medium screens (table-responsive-tablet)
- [x] Add responsive images and icons

### 5.4 Mobile Strategy Note
- [ ] Document mobile app requirements for future development
- [ ] Create mobile-specific feature wishlist
- [ ] Plan API endpoints for mobile app consumption
- [ ] Design offline-first data sync strategy

---

## 🎯 Implementation Priority Order

### Immediate (This Session)
1. AI Assistant slide-out panel with streaming
2. Task-oriented quick action buttons
3. Desktop/tablet responsive audit

### Short-term
4. Voice input for invoice creation
5. Proactive AI insights widget
6. Tablet gesture support

### Medium-term
7. Full conversational AI with context
8. AI-powered email drafts
9. Revenue forecasting

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to create invoice | ~3 min | <60 sec |
| AI feature usage | New | 40% of users |
| User satisfaction | Unknown | >4.5/5 |
| Mobile/tablet usage | Unknown | Track separately |



---

## 🐛 Bug Fixes

- [x] Fixed SQL query error on /expenses page (ambiguous column names with Drizzle ORM dynamic queries)
- [x] Added missing database columns: `billedAt` and `isTaxDeductible` to expenses table
- [x] Created comprehensive test suite for expenses query (8 passing tests)

- [x] Fix onboarding tour modal - allow clicking outside to dismiss


---

## 🗄️ Database Preparation for Production

- [x] Audit database schema and identify missing columns/errors
- [x] Apply database migrations to sync schema with Drizzle definitions (added 9 emailLog columns)
- [x] Create seed script for development mock data (scripts/seed-dev-data.mjs)
- [x] Create database reset script for empty state testing (scripts/reset-user-data.mjs)
- [x] Document environment management workflow (docs/DATABASE.md)
- [x] Add npm scripts: db:audit, db:sync, db:seed, db:reset


---

## 🦦 Sleeky Mascot Image Integration

- [x] Copy all Sleeky images to project assets (16 images organized in /sleeky/)
- [x] Audit existing Sleeky image usage
- [x] Update empty state components with correct images (10 empty states)
- [x] Update success state modals with Sleeky images (SubscriptionSuccess page)
- [x] Update error state displays with Sleeky images (ErrorBoundary component)
- [x] Update AI avatar to use sleekyAI-Avatar.png
- [x] Ensure all images load properly across the app

## UI Refinements (Jan 12, 2026)

- [x] Replace Wand2 icon with Sleeky avatar in MagicInput collapsed state
- [x] Replace sparkle orb with Sleeky avatar in AI Assistant button
- [x] Remove outer frame from Magic Invoice section on Dashboard


## SleekyAvatar Component Unification

- [x] Create unified SleekyAvatar component with card-matching border styles
- [x] Update MagicInput to use SleekyAvatar component
- [x] Update Orb/AI Assistant button to use SleekyAvatar component
- [x] Update AIAssistant panel to use SleekyAvatar component
- [x] Ensure PNG images display without unwanted borders (audited - all clean)
- [x] Test all empty states and verify Sleeky images load correctly


## Empty State Sleeky Illustrations

- [x] Replace generic icons with Sleeky illustrations in Invoices empty state
- [x] Replace generic icons with Sleeky illustrations in Clients empty state
- [x] Replace generic icons with Sleeky illustrations in Expenses empty state
- [x] Replace generic icons with Sleeky illustrations in Estimates empty state
- [x] Replace generic icons with Sleeky illustrations in Products empty state
- [x] Replace generic icons with Sleeky illustrations in Payments empty state
- [x] Replace generic icons with Sleeky illustrations in Recurring Invoices empty state
- [x] Replace generic icons with Sleeky illustrations in Dashboard empty state
- [x] Test all empty states display Sleeky correctly


## Update Sleeky Images with Larger Versions

- [x] Replace existing Sleeky images with new larger versions
- [x] Verify all empty states display correctly with new images


## Increase Sleeky Size in Empty States

- [x] Update EmptyState component illustration sizes to be larger (sm: h-40, md: h-56, lg: h-72)
- [x] Verify Sleeky appears more prominent in all empty states


## Make Sleeky Even Bigger with Opacity

- [x] Increase Sleeky illustration sizes further in EmptyState (sm: h-52, md: h-72, lg: h-96)
- [x] Add 95% opacity to empty state illustrations (not avatars)


## Finances Group UI Audit & Standardization

- [x] Audit Expenses page table/list components
- [x] Audit Products page table/list components
- [x] Audit Analytics page data display components
- [x] Audit Email History page table/list components
- [x] Document inconsistencies across all pages
- [x] Create standardized component architecture
- [x] Apply consistent design patterns to all pages
- [x] Verify visual cohesion across all Finances group pages

- [x] Apply FilterSection component to Expenses page

- [x] Fix non-functional dropdown on Expenses page
- [x] Standardize Expenses list to use Table component for consistency


---

## Navigation Responsiveness Improvements

- [x] Improve navigation responsiveness - tablet breakpoints, spacing, touch targets

---

## 🔒 Security Audit P0 Fixes (Production Blockers)

- [ ] P0-1: Add production error monitoring (Sentry integration)
- [ ] P0-2: Validate SKIP_AUTH flag against production environment
- [ ] P0-3: Wrap payment processing in database transactions (Stripe + NOWPayments)
- [ ] P0-4: Add PDF generation timeout
- [ ] P0-5: Add NOWPayments webhook deduplication

## 🔐 Security Audit P1 Fixes (First Production Week)

- [ ] P1-1: Fix NOWPayments signature bypass vulnerability
- [ ] P1-2: Encrypt QuickBooks OAuth tokens
- [ ] P1-3: Replace in-memory rate limiting with Redis (future)
- [ ] P1-4: Add invoice status race condition protection


---

## 🔒 SECURITY AUDIT P0 FIXES (Production Readiness)

### P0-1: Auth Bypass Validation
- [x] Add explicit production check for SKIP_AUTH flag
- [x] Fail hard if SKIP_AUTH=true in production environment

### P0-2: Non-Atomic Payments
- [x] Wrap Stripe payment processing in database transaction
- [x] Wrap NOWPayments processing in database transaction
- [x] Ensure payment record + invoice update happen atomically

### P0-3: PDF Generation Timeout
- [x] Add 30-second timeout to PDF generation
- [x] Implement browser cleanup on timeout
- [x] Track active browser instances for cleanup

### P0-4: Webhook Deduplication
- [x] Add idempotency check for NOWPayments webhooks
- [x] Check both payments and crypto subscription tables
- [x] Skip processing for already-processed payment IDs

### P0-5: NOWPayments Signature Bypass
- [x] Fail hard in production if no IPN secret configured
- [x] Only allow unsigned webhooks in development mode

### P0-6: Error Monitoring Infrastructure
- [x] Create errorMonitoring.ts module
- [x] Add Sentry integration (optional, activated with SENTRY_DSN)
- [x] Capture uncaught exceptions and unhandled rejections
- [x] Add context-aware error reporting

---


## Search UI Refinement

- [x] Remove wide search bar from navbar
- [x] Refine GlobalSearch modal UI
- [x] Fix mini search modal for tablet/mobile

