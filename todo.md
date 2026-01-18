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

## 🔧 Server-Side Code Refactoring - Jan 18, 2026

### Phase 1: Analysis
- [ ] Analyze server/db.ts structure and identify domain boundaries
- [ ] Analyze server/routers.ts structure and identify domain boundaries
- [ ] Create refactoring plan with domain modules

### Phase 2: Split server/db.ts
- [ ] Create server/db/ directory structure
- [ ] Extract invoice-related functions to server/db/invoices.ts
- [ ] Extract client-related functions to server/db/clients.ts
- [ ] Extract user-related functions to server/db/users.ts
- [ ] Extract expense-related functions to server/db/expenses.ts
- [ ] Extract payment-related functions to server/db/payments.ts
- [ ] Extract analytics-related functions to server/db/analytics.ts
- [ ] Create server/db/index.ts to re-export all functions
- [ ] Update original db.ts to import from new modules

### Phase 3: Split server/routers.ts
- [ ] Create server/routers/ directory structure
- [ ] Extract invoice routes to server/routers/invoices.ts
- [ ] Extract client routes to server/routers/clients.ts
- [ ] Extract user routes to server/routers/users.ts
- [ ] Extract expense routes to server/routers/expenses.ts
- [ ] Extract payment routes to server/routers/payments.ts
- [ ] Extract analytics routes to server/routers/analytics.ts
- [ ] Create server/routers/index.ts to merge all routers
- [ ] Update original routers.ts to use new modules

### Phase 4: Verification
- [ ] Run TypeScript check (pnpm check)
- [ ] Run full test suite (pnpm test)
- [ ] Verify application works in browser
| 2026-01-18 | Fix ClientTable dropdown menu actions (Edit, Delete, Portal Access) | ✅ Complete |
| 2026-01-18 | Add client duplicate functionality | ✅ Complete |
| 2026-01-18 | Add sorting indicators to ClientTable headers | ✅ Complete |
| 2026-01-18 | Test Portal Access feature | ✅ Complete |
| 2026-01-18 | Fix navbar avatar profile dropdown showing only one option | ✅ Complete |
| 2026-01-18 | Add hamburger menu to tablet view navigation | ✅ Complete |
| 2026-01-18 | Fix sidebar animation flickering when it appears | ✅ Complete |
| 2026-01-18 | Add OG banner image for social media sharing | ✅ Complete |
| 2026-01-18 | Replace hardcoded LD button with UserAvatar component in tablet/mobile nav | ✅ Complete |
| 2026-01-18 | Responsive design audit (320px-1440px breakpoints) | ✅ Complete |
| 2026-01-18 | Fix responsive: Template editor fixed width overflow (Critical) | ✅ Complete |
| 2026-01-18 | Fix responsive: Template editor sidebar fixed width (Critical) | ✅ Complete |
| 2026-01-18 | Fix responsive: Dashboard skeleton fixed width (Critical) | ✅ Complete |
| 2026-01-18 | Fix responsive: AI Assistant panel width (Major) | ✅ Complete |
| 2026-01-18 | Fix responsive: Google Font Picker popover width (Major) | ✅ Complete |
| 2026-01-18 | Fix responsive: Currency Selector popover width (Major) | ✅ Complete |
| 2026-01-18 | Fix responsive: Product Selector popover width (Major) | ✅ Complete |
| 2026-01-18 | Fix responsive: Tables horizontal scroll (Major) | ✅ Complete |
| 2026-01-18 | Fix responsive: Email Template Editor select width (Major) | ✅ Complete |
| 2026-01-18 | Fix minor: Default button height touch target (Minor #10) | ✅ Complete |
| 2026-01-18 | Fix minor: AI Assistant icon buttons under 44px (Minor #11) | ✅ Complete |
| 2026-01-18 | Fix minor: Very small text sizes text-[10px] (Minor #12) | ✅ Complete |
| 2026-01-18 | Fix minor: Batch Invoice select fixed width (Minor #13) | ✅ Complete |
| 2026-01-18 | Fix minor: Estimate page select fixed widths (Minor #14) | ✅ Complete (no fixed widths found) |
| 2026-01-18 | Fix minor: Payments page filter selects (Minor #15) | ✅ Complete |
| 2026-01-18 | Fix minor: Navigation sheet width (Minor #16) | ✅ Complete (already has max-w-[85vw]) |
| 2026-01-18 | Fix minor: Images without explicit dimensions (Minor #17) | ✅ Complete |
| 2026-01-18 | Fix minor: Line length control missing (Minor #18) | ✅ Complete (prose classes already used) |
| 2026-01-18 | Add horizontal scroll to Invoices table | ✅ Complete |
| 2026-01-18 | Add horizontal scroll to Expenses table | ✅ Complete |
| 2026-01-18 | Add horizontal scroll to Payments table | ✅ Complete || 2026-01-18 | Create ScrollableTableWrapper component with fade indicators | ✅ Complete | 2026-01-18 | Apply ScrollableTableWrapper to Invoices, Expenses, Clients tables | ✅ Complete |
| 2026-01-18 | Add ScrollableTableWrapper to Products table | ✅ Complete |
| 2026-01-18 | Add ScrollableTableWrapper to other tables (Estimates, EmailHistory) | ✅ Complete |
| 2026-01-18 | Implement mobile touch swipe hints | ✅ Complete |
| 2026-01-18 | Add ScrollableTableWrapper to InvoiceTable component | ✅ Complete |
| 2026-01-18 | Rams Design Review - Accessibility & Visual Design Audit | ✅ Complete |
| 2026-01-18 | Verify icon pack usage | ✅ Complete (Lucide-react primary, Phosphor secondary) |
| 2026-01-18 | Associate form inputs with labels | ✅ Complete |
| 2026-01-18 | Standardize z-index values with design tokens | ✅ Complete |
